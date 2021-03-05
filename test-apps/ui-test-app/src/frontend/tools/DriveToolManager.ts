/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import {
  IModelApp,
  NotifyMessageDetails,
  OutputMessagePriority,
  QuantityType,
  ScreenViewport,
} from '@bentley/imodeljs-frontend';
import { Easing } from '@bentley/imodeljs-common';
import { CurveChainWithDistanceIndex, Point3d, Vector3d } from '@bentley/geometry-core';
import { CustomRpcInterface, CustomRpcUtilities } from '../../common/CustomRpcInterface';
import { GeometricElement3d } from '../../../../../core/backend';
import { Angle } from '@bentley/geometry-core/lib/geometry3d/Angle';

export class DriveToolManager {

  private _viewport?: ScreenViewport;

  private _cameraPosition?: Point3d;
  private _cameraLookAt?: Vector3d;

  private _curveChain?: CurveChainWithDistanceIndex;
  private _target?: Point3d;
  private _targetDistance = 0;
  private _zAxisOffset = 1.5;

  private _currentFraction = 0;
  private _intervalId?: NodeJS.Timeout;
  private _intervalTime = 0.5;

  private _speed = 30;
  public get speed() {
    return this._speed;
  }

  public set speed(value: number) {
    this._speed = value;
  }

  public get zAxisOffset() {
    return this._zAxisOffset;
  }

  public set zAxisOffset(value: number) {
    this._zAxisOffset = value;
    this.updateCamera();
  }

  public async init(viewport?: ScreenViewport): Promise<void> {
    this._viewport = viewport;
    if (undefined === viewport)
      return;

    const view = viewport.view;
    if (!view.is3d() || !view.allow3dManipulations())
      return;

    if (view.iModel.selectionSet.size === 1) {
      const selectedElementId = view.iModel.selectionSet.elements.values().next().value;

      const response = await CustomRpcInterface.getClient().queryPath(view.iModel.getRpcProps(), selectedElementId);
      const path = CustomRpcUtilities.parsePath(response);
      if (path) {
        this._curveChain = CurveChainWithDistanceIndex.createCapture(path);
      }

      this._cameraPosition = this._curveChain?.fractionToPointAndDerivative(this._currentFraction).getOriginRef();
      this._cameraLookAt = this._curveChain?.fractionToPointAndDerivative(this._currentFraction).getDirectionRef();
      this.updateCamera()

      //void view.iModel.elements.getProps(selectedElementId).then(async (props) => {
      //  //TODO: delete
      //  const elementProp = props[0] as GeometricElement3d;
      //  const origin = elementProp.placement.origin as any;

      //  this._cameraPosition = this._curveChain?.fractionToPointAndDerivative(this._currentFraction).getOriginRef();
      //  this._cameraLookAt = this._curveChain?.fractionToPointAndDerivative(this._currentFraction).getDirectionRef();
      //  this.updateCamera();
      //});
    } else {
      const msg = `Must select only 1 element`;
      IModelApp.notifications.outputMessage(new NotifyMessageDetails(OutputMessagePriority.Warning, msg));
    }
  }

  public launch(): void {
    if (this._curveChain) {
      this._intervalId = setInterval(() => {
        this.step();
      }, this._intervalTime * 1000);
    }
  }

  private step(): void {
    if (this._curveChain) {
      const fraction = (this._speed * this._intervalTime) / this._curveChain.curveLength();
      this._currentFraction += fraction;
      this._cameraLookAt = this._curveChain?.fractionToPointAndDerivative(this._currentFraction).getDirectionRef();
      this._cameraPosition = this._curveChain?.fractionToPoint(this._currentFraction);
      this.updateCamera();
    }
  }

  public stop(): void {
    if (this._intervalId) {
      clearTimeout(this._intervalId);
    }
  }

  public setTarget(newTarget: Point3d | undefined): void {
    this._target = newTarget;
    if (this._cameraPosition && this._target) {
      const direction = Vector3d.createFrom(this._target.minus(this._cameraPosition));
      this._targetDistance = direction?.distance(Vector3d.create(0, 0, 0));

      IModelApp.quantityFormatter.getFormatterSpecByQuantityType(QuantityType.LengthEngineering).then(formatter => {
        const formattedDistance = IModelApp.quantityFormatter.formatQuantity(this._targetDistance, formatter);
        IModelApp.notifications.outputMessage(
          new NotifyMessageDetails(OutputMessagePriority.Info, `Distance: ${formattedDistance}`)
        );
      });
    }
  }

  private updateCamera(): void {
    const vp = this._viewport;
    if (undefined === vp)
      return;

    const view = vp.view;
    if (!view.is3d() || !view.allow3dManipulations())
      return;

    //if (this._cameraPosition && !this._cameraLookAt) {
    //  const eyePoint = Point3d.createFrom(this._cameraPosition);
    //  eyePoint.addInPlace(Vector3d.unitZ(this._zAxisOffset));
    //  view.camera.setEyePoint(eyePoint);
    //}

    //change target of camera
    if (this._cameraPosition && this._cameraLookAt) {
      const eyePoint = Point3d.createFrom(this._cameraPosition);
      eyePoint.addInPlace(Vector3d.unitZ(this._zAxisOffset));
      view.lookAtUsingLensAngle(eyePoint, eyePoint.plus(this._cameraLookAt), new Vector3d(0, 0, 1), Angle.createDegrees(120));
    }

    vp.synchWithView({
      animateFrustumChange: true,
      animationTime: this._intervalTime * 1000,
      easingFunction: Easing.Linear.None,
    });
  }
}
