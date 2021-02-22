/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import {
  BeButtonEvent,
  EventHandled,
  IModelApp,
  NotifyMessageDetails,
  OutputMessagePriority,
  PrimitiveTool,
  ScreenViewport,
  ToolAssistance,
  ToolAssistanceImage
} from '@bentley/imodeljs-frontend';
import { Point3d, Vector3d } from '@bentley/geometry-core';
import { GeometricElement3d } from '../../../../../core/backend';
import { Point } from '../../../../../ui/core';


export class DriveTool extends PrimitiveTool {

  public static toolId = 'DriveTool';
  public static iconSpec = 'icon-airplane';

  public viewport?: ScreenViewport;
  private _origin?: Point3d;
  private _target?: Point3d;
  private _direction?: Vector3d;

  private _zAxisOffset = 1.5;
  public get zAxisOffset() { return this._zAxisOffset; }
  public set zAxisOffset(value: number) {
    this._zAxisOffset = value;
    this.updateCamera();
  }

  public launch(): void {
    console.log('origin', this._origin)
    console.log('target', this._target)
    if (this._origin && this._target) {
      const direction = Vector3d.createFrom(this._target.minus(this._origin)).scaleToLength(-10);
      console.log('direction', direction)
      if (direction) {
        this._origin.addInPlace(Point3d.createFrom(direction));
      }
    }
    this.updateCamera();
  }

  public requireWriteableTarget(): boolean {
    return false;
  }

  public onPostInstall() {
    console.warn('post install');
    super.onPostInstall();

    this.viewport = IModelApp.viewManager.selectedView;
    this.setupOrigin();

    this.setupAndPromptForNextAction();
  }

  public onUnsuspend(): void {
    this.provideToolAssistance();
  }

  protected setupAndPromptForNextAction(): void {
    this.provideToolAssistance();
  }

  protected provideToolAssistance(): void {
    const mainInstruction = ToolAssistance.createInstruction(ToolAssistanceImage.CursorClick, 'Select an object');
    const instructions = ToolAssistance.createInstructions(mainInstruction);

    IModelApp.notifications.setToolAssistance(instructions);
  }

  public async onDataButtonDown(ev: BeButtonEvent): Promise<EventHandled> {
    console.warn('data button down', ev);
    this._target = ev.rawPoint;
    this.updateCamera();
    return EventHandled.Yes
  }

  private updateCamera(): void {
    const vp = this.viewport;
    if (undefined === vp)
      return;

    const view = vp.view;
    if (!view.is3d() || !view.allow3dManipulations())
      return;

    if (this._origin) {
      const eyePoint = Point3d.createFrom(this._origin);
      eyePoint.addInPlace(Vector3d.unitZ(this._zAxisOffset));
      view.camera.setEyePoint(eyePoint);
    }

    if (this._target !== undefined) {
      view.lookAtUsingLensAngle(view.getEyePoint(), this._target, Vector3d.unitZ(), view.getLensAngle());
    }

    vp.synchWithView({animateFrustumChange: true});
  }

  private setupOrigin(): void {
    const vp = this.viewport;
    if (undefined === vp)
      return;

    const view = vp.view;
    if (!view.is3d() || !view.allow3dManipulations())
      return;

    if (view.iModel.selectionSet.size === 1) {
      let selectedElement = view.iModel.selectionSet.elements.values().next().value;
      view.iModel.elements.getProps(selectedElement).then(props => {
        let elementProp = props[0] as GeometricElement3d;
        let origin = elementProp.placement.origin as any;
        this._origin = new Point3d(origin[0], origin[1], origin[2]);
        this.updateCamera();
      });
    } else {
      const msg = `Must select only 1 element`;
      IModelApp.notifications.outputMessage(new NotifyMessageDetails(OutputMessagePriority.Warning, msg));
    }
  }

  public async onResetButtonUp(_ev: BeButtonEvent): Promise<EventHandled> {
    this.onReinitialize();
    return EventHandled.No;
  }

  public onRestartTool(): void {
    const tool = new DriveTool();
    if (!tool.run())
      this.exitTool();
  }
}
