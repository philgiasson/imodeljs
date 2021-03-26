/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import {
  BeButtonEvent,
  BeWheelEvent,
  DecorateContext,
  EventHandled,
  IModelApp, LengthDescription,
  LocateResponse,
  PrimitiveTool,
  ToolAssistance,
  ToolAssistanceImage,
} from '@bentley/imodeljs-frontend';
import { DriveToolManager } from "./DriveToolManager";
import { DriveToolConfig } from "./DriveToolConfig";
import { DialogItem, DialogProperty, PropertyDescriptionHelper } from '../../../../../ui/abstract';

export class DriveTool extends PrimitiveTool {

  public static toolId = "DriveTool";
  public static iconSpec = "icon-airplane";

  private _manager = new DriveToolManager();
  private _keyIntervalId?: NodeJS.Timeout;
  private _keyIntervalTime = 50;

  public heightProperty = new DialogProperty<number>(new LengthDescription("height"), 1.5);

  public get manager() {
    return this._manager;
  }

  public requireWriteableTarget(): boolean {
    return false;
  }

  public onPostInstall() {
    super.onPostInstall();
    IModelApp.accuSnap.enableSnap(true);
    void this._manager.init().then();
    this.setupAndPromptForNextAction();
  }

  public onUnsuspend(): void {
    this.provideToolAssistance();
  }

  protected setupAndPromptForNextAction(): void {
    this.provideToolAssistance();
  }

  public decorate(context: DecorateContext): void {
    context.addCanvasDecoration(this._manager.decoration);
  }

  protected provideToolAssistance(): void {
    const mainInstruction = ToolAssistance.createInstruction(ToolAssistanceImage.CursorClick, "Select an object");

    const toggleInstruction = ToolAssistance.createKeyboardInstruction(ToolAssistance.createKeyboardInfo(["T"]), "Toggle movement");
    const speedInstruction = ToolAssistance.createKeyboardInstruction(ToolAssistance.createKeyboardInfo(["W", "S"]), "Adjust speed");
    const heightInstruction = ToolAssistance.createKeyboardInstruction(ToolAssistance.createKeyboardInfo(["Q", "E"]), "Adjust height");
    const lateralOffsetInstruction = ToolAssistance.createKeyboardInstruction(ToolAssistance.createKeyboardInfo(["A", "D"]), "Adjust lateral offset");
    const fovInstruction = ToolAssistance.createInstruction(ToolAssistanceImage.MouseWheel, "Adjust Fov");

    const section1 = ToolAssistance.createSection([toggleInstruction, speedInstruction, lateralOffsetInstruction, heightInstruction, fovInstruction]);
    const instructions = ToolAssistance.createInstructions(mainInstruction, [section1]);
    IModelApp.notifications.setToolAssistance(instructions);
  }

  public async onDataButtonDown(ev: BeButtonEvent): Promise<EventHandled> {
    const hit = await IModelApp.locateManager.doLocate(new LocateResponse(), true, ev.point, ev.viewport, ev.inputSource);
    this._manager.setHit(hit);
    return EventHandled.Yes;
  }

  public async onKeyTransition(_wentDown: boolean, _keyEvent: KeyboardEvent): Promise<EventHandled> {
    if (this._keyIntervalId) {
      clearTimeout(this._keyIntervalId);
    }
    if (_wentDown) {
      switch (_keyEvent.key) {
        case "t": this._manager.toggleMovement(); break;
        case "r": this._manager.reverseCurve(); break;
        case "w": this._keyIntervalId = setInterval(() => {this._manager.speed += DriveToolConfig.speedStep;}, this._keyIntervalTime); break;
        case "s": this._keyIntervalId = setInterval(() => {this._manager.speed -= DriveToolConfig.speedStep;}, this._keyIntervalTime); break;
        case "a": this._keyIntervalId = setInterval(() => {this._manager.lateralOffset -= DriveToolConfig.lateralOffsetStep;}, this._keyIntervalTime); break;
        case "d": this._keyIntervalId = setInterval(() => {this._manager.lateralOffset += DriveToolConfig.lateralOffsetStep;}, this._keyIntervalTime); break;
        case "q": this._keyIntervalId = setInterval(() => {this._manager.zAxisOffset -= DriveToolConfig.speedStep;}, this._keyIntervalTime); break;
        case "e": this._keyIntervalId = setInterval(() => {this._manager.zAxisOffset += DriveToolConfig.speedStep;}, this._keyIntervalTime); break;
      }
    }
    return EventHandled.Yes;
  }

  /**
   * Handle onMouseWheel events to prevent zooming while using tool.
   */
  public async onMouseWheel(_ev: BeWheelEvent): Promise<EventHandled> {
    if (_ev.wheelDelta > 0) {
      this._manager.fov -= DriveToolConfig.fovStep * 5;
    } else if (_ev.wheelDelta < 0) {
      this._manager.fov += DriveToolConfig.fovStep * 5;
    }
    return EventHandled.Yes;
  }

  public async onMouseMotion(ev: BeButtonEvent): Promise<void> {
    const hit = await IModelApp.locateManager.doLocate(new LocateResponse(), true, ev.point, ev.viewport, ev.inputSource);
    this._manager.decoration.mousePosition = ev.viewPoint;
    this._manager.decoration.distance = hit ? this._manager.calculateDistance(hit?.getPoint()) : 0;
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


  public supplyToolSettingsProperties(): DialogItem[] | undefined {
    const toolSettings = new Array<DialogItem>();
    toolSettings.push(this.heightProperty.toDialogItem({ rowPriority: 1, columnIndex: 1 }));
    return toolSettings;
  }
}
