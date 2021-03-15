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
  PrimitiveTool,
  ToolAssistance,
  ToolAssistanceImage,
} from "@bentley/imodeljs-frontend";
import { DriveToolManager } from "./DriveToolManager";

export class DriveTool extends PrimitiveTool {

  public static toolId = "DriveTool";
  public static iconSpec = "icon-airplane";

  private _manager = new DriveToolManager();

  public get manager() {
    return this._manager;
  }

  public requireWriteableTarget(): boolean {
    return false;
  }

  public onPostInstall() {
    super.onPostInstall();
    IModelApp.accuSnap.enableSnap(true);
    void this._manager.init(IModelApp.viewManager.selectedView).then();
    this.setupAndPromptForNextAction();
  }

  public onUnsuspend(): void {
    this.provideToolAssistance();
  }

  protected setupAndPromptForNextAction(): void {
    this.provideToolAssistance();
  }

  protected provideToolAssistance(): void {
    const mainInstruction = ToolAssistance.createInstruction(ToolAssistanceImage.CursorClick, "Select an object");

    const toggleInstruction = ToolAssistance.createKeyboardInstruction(ToolAssistance.createKeyboardInfo(["T"]), "Toggle movement");
    const speedInstruction = ToolAssistance.createKeyboardInstruction(ToolAssistance.createKeyboardInfo(["W", "S"]), "Adjust speed");
    const lateralOffsetInstruction = ToolAssistance.createKeyboardInstruction(ToolAssistance.createKeyboardInfo(["A", "D"]), "Adjust lateral offset");
    const increaseHeightInstruction = ToolAssistance.createKeyboardInstruction(ToolAssistance.shiftKeyboardInfo, "Increase height");
    const decreaseHeightInstruction = ToolAssistance.createKeyboardInstruction(ToolAssistance.ctrlKeyboardInfo, "Decrease height");
    const fovInstruction = ToolAssistance.createInstruction(ToolAssistanceImage.MouseWheel, "Adjust Fov");

    const section1 = ToolAssistance.createSection([toggleInstruction, speedInstruction, lateralOffsetInstruction, increaseHeightInstruction, decreaseHeightInstruction, fovInstruction]);
    const instructions = ToolAssistance.createInstructions(mainInstruction, [section1]);
    IModelApp.notifications.setToolAssistance(instructions);
  }

  public async onDataButtonDown(ev: BeButtonEvent): Promise<EventHandled> {
    const hit = await IModelApp.locateManager.doLocate(new LocateResponse(), true, ev.point, ev.viewport, ev.inputSource);
    this._manager.setHit(hit);
    return EventHandled.Yes;
  }

  public async onKeyTransition(_wentDown: boolean, _keyEvent: KeyboardEvent): Promise<EventHandled> {
    if (_wentDown && _keyEvent.key === "t") {
      this._manager.toggleMovement();
    }
    return EventHandled.Yes;
  }

  /**
   * Handle onMouseWheel events to prevent zooming while using tool.
   */
  public async onMouseWheel(_ev: BeWheelEvent): Promise<EventHandled> {
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
