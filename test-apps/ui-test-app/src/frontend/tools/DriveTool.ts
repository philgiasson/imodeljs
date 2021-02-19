/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import {
  BeButtonEvent,
  EventHandled,
  IModelApp,
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

  public requireWriteableTarget(): boolean {
    return false;
  }

  public onPostInstall() {
    super.onPostInstall();
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
    console.warn(ev);

    this.viewport = ev.viewport;

    const vp = this.viewport;
    if (undefined === vp)
      return EventHandled.Yes;

    const view = vp.view;
    if (!view.is3d() || !view.allow3dManipulations())
      return EventHandled.Yes;


    view.iModel.elements.getProps("0x20000000d31").then(props => {

      let elementProp = props[0] as GeometricElement3d;
      console.warn(elementProp);

      let origin = elementProp.placement.origin as any;
      console.warn(origin);

      let point = new Point3d(origin[0], origin[1], origin[2])

      point.addInPlace(Vector3d.unitZ(2));

      view.camera.setEyePoint(point);
      vp.synchWithView({animateFrustumChange: true});
    });

    return EventHandled.Yes;
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
