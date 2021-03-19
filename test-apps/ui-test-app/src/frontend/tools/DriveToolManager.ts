/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import {
  HitDetail,
  IModelApp,
  QuantityType,
  ScreenViewport,
  ViewState3d,
} from "@bentley/imodeljs-frontend";
import { Easing } from "@bentley/imodeljs-common";
import { CurveChainWithDistanceIndex, Point3d, Vector3d } from "@bentley/geometry-core";
import { CustomRpcInterface, CustomRpcUtilities } from "../../common/CustomRpcInterface";
import { Angle } from "@bentley/geometry-core/lib/geometry3d/Angle";
import { DriveToolConfig } from "./DriveToolConfig";
import { DistanceDisplayDecoration } from "./DistanceDisplayDecoration";

export class DriveToolManager {

  private _viewport?: ScreenViewport;
  private _view?: ViewState3d;

  private _cameraPosition?: Point3d;
  private _cameraLookAt?: Vector3d;
  private _selectedCurve?: CurveChainWithDistanceIndex;

  private _zAxisOffset = DriveToolConfig.zAxisOffsetDefault;
  private _lateralOffset = DriveToolConfig.lateralOffsetDefault;
  private _speed = DriveToolConfig.speedDefault;
  private _fov = DriveToolConfig.fovDefault;

  private _moving = false;
  private _progress = 0;
  private _intervalTime = 0.5;
  private _intervalId?: NodeJS.Timeout;

  private _decoration: DistanceDisplayDecoration = new DistanceDisplayDecoration();

  public get decoration(): DistanceDisplayDecoration {
    return this._decoration;
  }

  public get progress(): number {
    return this._progress;
  }

  public set progress(value: number) {
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

  public get zAxisOffset() {
    return this._zAxisOffset;
  }

  public set zAxisOffset(value: number) {
    value = value <= DriveToolConfig.zAxisOffsetMax ? value : DriveToolConfig.zAxisOffsetMax;
    value = value >= DriveToolConfig.zAxisOffsetMin ? value : DriveToolConfig.zAxisOffsetMin;
    this._zAxisOffset = value;
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
    if (!this._moving) {
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
    }
  }

  public toggleMovement(): void {
    this._moving ? this.stop() : this.launch();
  }

  public updateDecorationPosition(pt: Point3d) {
    this._decoration.x = pt.x + 30;
    this._decoration.y = pt.y + 10;
  }

  public setHit(hit: HitDetail | undefined): void {
    if (this._selectedCurve) {
      this.calculateDistance(hit?.getPoint());
    } else {
      void this.setSelectedCurve(hit?.sourceId);
    }
  }

  public calculateDistance(target: Point3d | undefined): void {
    if (this._cameraPosition && target) {
      const distanceVector = Vector3d.createFrom(target.minus(this._cameraPosition));
      const distance = distanceVector?.distance(Vector3d.create(0, 0, 0));

      void IModelApp.quantityFormatter.getFormatterSpecByQuantityType(QuantityType.LengthEngineering).then((formatter) => {
        const formattedDistance = IModelApp.quantityFormatter.formatQuantity(distance, formatter);
        // IModelApp.notifications.outputMessage(
        //   new NotifyMessageDetails(OutputMessagePriority.Info, `Distance: ${formattedDistance}`)
        // );
        this._decoration.text = formattedDistance;
      });
    }
  }

  public async setSelectedCurve(selectedElementId: any) {
    if (!this._view)
      return;

    const response = await CustomRpcInterface.getClient().queryPath(this._view.iModel.getRpcProps(), selectedElementId);
    const path = CustomRpcUtilities.parsePath(response);
    if (path) {
      this._selectedCurve = CurveChainWithDistanceIndex.createCapture(path);
      this.updateProgress();
    }
  }

  private step(): void {
    if (this._selectedCurve) {
      const fraction = (this._speed * this._intervalTime) / this._selectedCurve.curveLength();
      this._progress += fraction;
      this.updateProgress();
    }
  }

  private updateProgress() {
    if (this._selectedCurve) {
      this._cameraLookAt = this._selectedCurve?.fractionToPointAndUnitTangent(this._progress).getDirectionRef();
      this._cameraPosition = this._selectedCurve?.fractionToPoint(this._progress);
      this.updateCamera();
    }
  }

  private updateCamera(): void {
    if (!this._viewport || !this._view)
      return;

    if (this._cameraPosition && this._cameraLookAt) {
      const eyePoint = Point3d.createFrom(this._cameraPosition);
      eyePoint.addInPlace(Vector3d.unitZ(this._zAxisOffset));
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
