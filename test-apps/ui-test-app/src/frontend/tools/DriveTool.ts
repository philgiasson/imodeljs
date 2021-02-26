/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import {
  BeButtonEvent,
  BeWheelEvent,
  EventHandled,
  IModelApp,
  LocateResponse,
  NotifyMessageDetails,
  OutputMessagePriority,
  PrimitiveTool,
  ScreenViewport,
  ToolAssistance,
  ToolAssistanceImage
} from '@bentley/imodeljs-frontend';
import { Point3d, Vector3d } from '@bentley/geometry-core';
import { GeometricElement3d } from '../../../../../core/backend';


export class DriveTool extends PrimitiveTool {

  public static toolId = 'DriveTool';
  public static iconSpec = 'icon-airplane';

  public viewport?: ScreenViewport;

  private _origin?: Point3d;
  private _target?: Point3d;

  private _targetDistance = 0;
  public get targetDistance() {
    return this._targetDistance;
  }

  private _zAxisOffset = 1.5;
  public get zAxisOffset() {
    return this._zAxisOffset;
  }

  public set zAxisOffset(value: number) {
    this._zAxisOffset = value;
    this.updateCamera();
  }

  public launch(): void {
    this.updateCamera();
  }

  private setTarget(newTarget: Point3d | undefined): void {
    this._target = newTarget;
    console.warn('origin', this._origin);
    console.warn('target', this._target);
    if (this._origin && this._target) {
      const direction = Vector3d.createFrom(this._target.minus(this._origin));
      console.warn('direction', direction);
      this._targetDistance = direction?.distance(Vector3d.create(0 ,0 ,0));
      console.warn('distance', this._targetDistance);
      IModelApp.notifications.outputMessage(new NotifyMessageDetails(OutputMessagePriority.Info,
        `Distance: ${Math.round(this._targetDistance)}m`));
    }
  }

  public requireWriteableTarget(): boolean {
    return false;
  }

  public onPostInstall() {
    super.onPostInstall();

    IModelApp.accuSnap.enableSnap(true);
    this.viewport = IModelApp.viewManager.selectedView;
    this.setOriginToSelectedElement();

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
    const hit = await IModelApp.locateManager.doLocate(new LocateResponse(), true, ev.point, ev.viewport, ev.inputSource);
    this.setTarget(hit?.getPoint());
    return EventHandled.Yes;
  }


  public async onMouseWheel(_ev: BeWheelEvent): Promise<EventHandled> {
    return EventHandled.Yes;
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

    vp.synchWithView({animateFrustumChange: true});
  }

  private setOriginToSelectedElement(): void {
    const vp = this.viewport;
    if (undefined === vp)
      return;

    const view = vp.view;
    if (!view.is3d() || !view.allow3dManipulations())
      return;

    if (view.iModel.selectionSet.size === 1) {
      let selectedElementId = view.iModel.selectionSet.elements.values().next().value;
      view.iModel.elements.getProps(selectedElementId).then(props => {
        console.warn('selected element', props[0])
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
