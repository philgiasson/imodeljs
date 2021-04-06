/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import {
  BeButtonEvent,
  HitDetail,
  IModelApp,
  LocateResponse,
  ScreenViewport,
  ViewRect,
  ViewState3d,
} from "@bentley/imodeljs-frontend";
import { Easing } from "@bentley/imodeljs-common";
import { CurveChainWithDistanceIndex, Point3d, Vector3d } from "@bentley/geometry-core";
import { CustomRpcInterface, CustomRpcUtilities } from "../../common/CustomRpcInterface";
import { Angle } from "@bentley/geometry-core/lib/geometry3d/Angle";
import { DriveToolConfig } from "./DriveToolConfig";
import { DistanceDisplayDecoration } from "./DistanceDisplayDecoration";
import { Rect } from "@svgdotjs/svg.js";

export class DriveToolManager {

  private _viewport?: ScreenViewport;
  private _view?: ViewState3d;

  private _cameraPosition?: Point3d;
  private _cameraLookAt?: Vector3d;
  private _selectedCurve?: CurveChainWithDistanceIndex;

  private _height = DriveToolConfig.heightDefault;
  private _lateralOffset = DriveToolConfig.lateralOffsetDefault;
  private _speed = DriveToolConfig.speedDefault;
  private _fov = DriveToolConfig.fovDefault;

  private _moving = false;
  private _progress = 0;
  private _intervalTime = 0.5;
  private _intervalId?: NodeJS.Timeout;
  private _decoration = new DistanceDisplayDecoration();
  mouseViewPoint: Point3d | undefined;

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
      this._intervalId = setInterval(async () => {
        this.step();
        // PIXEL
        // const testPointView = this.mouseEvent?.viewPoint;
        // this._viewport?.dopick;
        // if (testPointView) {
        //   const pixelRadius = Math.floor(pickRadiusView + 0.5);
        //   const rect = new ViewRect(testPointView.x - pixelRadius, testPointView.y - pixelRadius, testPointView.x + pixelRadius, testPointView.y + pixelRadius);
        // }
        // this._viewport?.readPixels(Rect);

        // this._viewport?.getPixelDataWorldPoint(pixels,);
        // console.warn(this.mouseEvent);
        // this.decoration.distance = this.mouseEvent ? this.calculateDistance(this.mouseEvent?.testPoint) : 0;

        await IModelApp.accuSnap.reEvaluate();
        const hit = IModelApp.accuSnap.currHit;
        console.warn("hit:", hit?.hitPoint);
        this.decoration.distance = hit ? this.calculateDistance(hit?.getPoint()) : 0;

        // // This doesn't work because it use accuSnap witch is not updated
        // const ev = new BeButtonEvent();
        // IModelApp.toolAdmin.fillEventFromCursorLocation(ev);
        // console.warn("ev:", ev);
        // const hit = await IModelApp.locateManager.doLocate(new LocateResponse(), true, ev.point, ev.viewport, ev.inputSource);
        // this.decoration.distance = hit ? this.calculateDistance(hit?.getPoint()) : 0;

        // if (this._viewport && this.mouseViewPoint) {
        //   const worldPoint = this._viewport?.viewToWorld(this.mouseViewPoint);
        //   IModelApp.locateManager.clear();
        //   const hit = await IModelApp.locateManager.doLocate(new LocateResponse(), true, worldPoint, this._viewport, 1);
        //   console.warn("hit: ", hit?.getPoint());
        //   console.warn("wpoint: ", worldPoint);
        //   this.decoration.distance = hit ? this.calculateDistance(hit?.getPoint()) : 0;
        // }

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

  public setHit(hit: HitDetail | undefined): void {
    if (!this._selectedCurve) {
      void this.setSelectedCurve(hit?.sourceId);
    }
  }

  public calculateDistance(target: Point3d | undefined): number {
    if (this._cameraPosition && target) {
      const distanceVector = Vector3d.createFrom(target.minus(this._cameraPosition));
      return distanceVector?.distance(Vector3d.create(0, 0, 0));
    } else {
      return 0;
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
      this._cameraPosition = this._selectedCurve?.fractionToPoint(this._progress);
      this.updateCamera();
    }
  }

  private updateCamera(): void {
    if (!this._viewport || !this._view)
      return;

    if (this._cameraPosition && this._cameraLookAt) {
      const eyePoint = Point3d.createFrom(this._cameraPosition);
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
