/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import {
  HitDetail,
  IModelApp,
  NotifyMessageDetails,
  OutputMessagePriority,
  ScreenViewport,
  ViewState3d,
} from "@bentley/imodeljs-frontend";
import { Easing } from "@bentley/imodeljs-common";
import { Angle, CurveChainWithDistanceIndex, Point3d, Vector3d } from "@bentley/geometry-core";
import { CustomRpcInterface, CustomRpcUtilities } from "../../../common/CustomRpcInterface";
import { DriveToolConfig } from "./DriveToolConfig";
import { DistanceDisplayDecoration } from "./DistanceDisplayDecoration";

export class DriveToolManager {

  /** Viewport used by the tool */
  private _viewport?: ScreenViewport;
  /** Viewport used by the tool */
  public _view?: ViewState3d;

  /** Curve to follow when enabling movement */
  private _selectedCurve?: CurveChainWithDistanceIndex;

  /** Vector indicating what direction the camera should be looking at */
  private _cameraLookAt?: Vector3d;
  /** Camera field of view */
  private _fov = DriveToolConfig.fovDefault;

  /** Indicates wether movement is currently enabled */
  private _moving = false;
  /** Current movement progress accross the selected curve from 0 to 1 */
  private _progress = 0;
  /** Current position on the curve */
  private _positionOnCurve?: Point3d;
  /** Camera offset on the z axis from the current position on the selected curve */
  private _height = DriveToolConfig.heightDefault;
  /** Camera offset perpendicular to the view direction from the current position on the selected curve */
  private _lateralOffset = DriveToolConfig.lateralOffsetDefault;
  /** Speed of the movement along the selected curve in unit/s */
  private _speed = DriveToolConfig.speedDefault;

  /** Time between each calculation of the next position to move to along the curve */
  private _intervalTime = DriveToolConfig.intervalTime;
  /** Id of the current movement interval */
  private _intervalId?: NodeJS.Timeout;

  constructor(private _decoration: DistanceDisplayDecoration) {
  }

  public get decoration(): DistanceDisplayDecoration {
    return this._decoration;
  }

  public get progress(): number {
    return this._progress;
  }

  public set progress(value: number) {
    value = value > 0 ? value : 0;
    value = value < 1 ? value : 1;
    this._progress = value;
    this.updateProgress();
  }

  public get speed(): number {
    return this._speed;
  }

  public set speed(value: number) {
    value = value <= DriveToolConfig.speedMax ? value : DriveToolConfig.speedMax;
    value = value >= DriveToolConfig.speedMin ? value : DriveToolConfig.speedMin;
    this._speed = value;
  }

  public get fov(): number {
    return this._fov;
  }

  public set fov(value: number) {
    value = value <= DriveToolConfig.fovMax ? value : DriveToolConfig.fovMax;
    value = value >= DriveToolConfig.fovMin ? value : DriveToolConfig.fovMin;
    this._fov = value;
    this.updateCamera();
  }

  public get height() {
    return this._height;
  }

  public set height(value: number) {
    value = value <= DriveToolConfig.heightMax ? value : DriveToolConfig.heightMax;
    value = value >= DriveToolConfig.heightMin ? value : DriveToolConfig.heightMin;
    this._height = value;
    this.updateCamera();
  }

  public get lateralOffset() {
    return this._lateralOffset;
  }

  public set lateralOffset(value: number) {
    value = value <= DriveToolConfig.lateralOffsetMax ? value : DriveToolConfig.lateralOffsetMax;
    value = value >= DriveToolConfig.lateralOffsetMin ? value : DriveToolConfig.lateralOffsetMin;
    this._lateralOffset = value;
    this.updateCamera();
  }

  public getPointsShape(): Point3d[] {

    const y = 50;
    const z = 5;

    const tan = this._selectedCurve?.fractionToPointAndUnitTangent(this._progress + 0.1).getDirectionRef();
    const pos = this._selectedCurve?.fractionToPoint(this._progress + 0.1);
    if (pos) {
      return [new Point3d(pos?.x, pos?.y-y/2, pos?.z-2), new Point3d(pos?.x, pos?.y-y/2, pos?.z+z-2),
        new Point3d(pos?.x, pos?.y+y/2, pos?.z+z), new Point3d(pos?.x, pos?.y+y/2, pos?.z), new Point3d(pos?.x, pos?.y-y/2, pos?.z)];
    } else {
      return [new Point3d()];
    }
  }

  public async init(): Promise<void> {
    this._viewport = IModelApp.viewManager.selectedView;
    if (undefined === this._viewport)
      return;

    const view = this._viewport.view;
    if (!view.is3d() || !view.allow3dManipulations())
      return;

    this._view = view;

    // TODO: review behavior when size > 1
    if (view.iModel.selectionSet.size === 1) {
      const selectedElementId = view.iModel.selectionSet.elements.values().next().value;
      await this.setSelectedCurve(selectedElementId);
    }
  }

  public launch(): void {
    if (this._selectedCurve && !this._moving) {
      this._moving = true;
      this._intervalId = setInterval(() => {
        this.step();
      }, this._intervalTime * 1000);
    }
  }

  public stop(): void {
    if (this._intervalId) {
      this._moving = false;
      clearTimeout(this._intervalId);
      this._intervalId = undefined;
    }
  }

  public toggleMovement(): void {
    this._moving ? this.stop() : this.launch();
  }

  public setHit(hit: HitDetail | undefined): void {
    if (!this._selectedCurve) {
      void this.setSelectedCurve(hit?.sourceId);
    }
  }

  public calculateDistance(target: Point3d | undefined): number {
    if (this._positionOnCurve && target) {
      const distanceVector = Vector3d.createFrom(target.minus(this._positionOnCurve));
      return distanceVector?.distance(Vector3d.create(0, 0, 0));
    } else {
      return 0;
    }
  }

  public async setSelectedCurve(selectedElementId: any) {
    if (!this._view)
      return;

    const pathResponse = await CustomRpcInterface.getClient().queryPath(this._view.iModel.getRpcProps(), selectedElementId);
    const path = CustomRpcUtilities.parsePath(pathResponse);

    if (path) {
      this._selectedCurve = CurveChainWithDistanceIndex.createCapture(path);
      this.updateProgress();
    } else {
      const message = new NotifyMessageDetails(OutputMessagePriority.Warning, "Can't find path for selected element");
      IModelApp.notifications.outputMessage(message);
    }

    this._view.iModel.selectionSet.emptyAll();
  }

  public reverseCurve(): void {
    this._progress = 1 - this._progress;
    this._selectedCurve?.reverseInPlace();
    this.updateProgress();
  }

  private step(): void {
    if (this._selectedCurve) {
      const fraction = (this._speed * this._intervalTime) / this._selectedCurve.curveLength();
      this.progress += fraction;
    }
  }

  private updateProgress() {
    if (this._selectedCurve) {
      this._cameraLookAt = this._selectedCurve?.fractionToPointAndUnitTangent(this._progress).getDirectionRef();
      this._positionOnCurve = this._selectedCurve?.fractionToPoint(this._progress);
      this.updateCamera();
    }
  }

  private updateCamera(): void {
    if (!this._viewport || !this._view)
      return;

    if (this._positionOnCurve && this._cameraLookAt) {
      const eyePoint = Point3d.createFrom(this._positionOnCurve);
      eyePoint.addInPlace(Vector3d.unitZ(this._height));
      eyePoint.addInPlace(Vector3d.unitZ().crossProduct(this._cameraLookAt).scale(-this._lateralOffset));
      this._view.lookAtUsingLensAngle(eyePoint, eyePoint.plus(this._cameraLookAt), new Vector3d(0, 0, 1), Angle.createDegrees(this._fov));
    }

    this._viewport.synchWithView({
      animateFrustumChange: true,
      animationTime: this._intervalTime * 1000,
      easingFunction: Easing.Linear.None,
    });
  }
}
