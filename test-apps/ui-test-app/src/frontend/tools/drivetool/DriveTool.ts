/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import {
  BeButtonEvent,
  BeWheelEvent,
  DecorateContext,
  EventHandled,
  GraphicType,
  IModelApp,
  LocateResponse,
  PrimitiveTool,
  ToolAssistance,
  ToolAssistanceImage,
} from "@bentley/imodeljs-frontend";
import { DriveToolManager } from "./DriveToolManager";
import { DriveToolConfig } from "./DriveToolConfig";
import { DialogItem, DialogPropertySyncItem } from "@bentley/ui-abstract";
import { ToolItemDef } from "@bentley/ui-framework";
import { DriveToolProperties } from "./DriveToolProperties";
import { ColorDef } from "@bentley/imodeljs-common";
import { DistanceDisplayDecoration } from "./DistanceDisplayDecoration";

export class DriveTool extends PrimitiveTool {

  public static toolId = "DriveTool";
  public static iconSpec = "icon-airplane";

  private _manager = new DriveToolManager(new DistanceDisplayDecoration());
  private _keyIntervalId?: NodeJS.Timeout;
  private _keyIntervalTime = 50;

  public applyToolSettingPropertyChange(updatedValue: DialogPropertySyncItem): boolean {
    const value = updatedValue.value.value as number;
    switch (updatedValue.propertyName) {
      case DriveToolProperties.height.name: this._manager.height = value; break;
      case DriveToolProperties.lateralOffset.name: this._manager.lateralOffset = value; break;
      case DriveToolProperties.speed.name: this._manager.speed = value / 3.6; break;
      case DriveToolProperties.fov.name: this._manager.fov = value; break;
      case DriveToolProperties.progress.name: this._manager.progress = value; break;
      case DriveToolProperties.targetDistance.name: this._manager.targetDistance = value; break;
    }
    this.syncAllSettings();
    return true;
  }

  public supplyToolSettingsProperties(): DialogItem[] | undefined {
    const toolSettings = new Array<DialogItem>();
    toolSettings.push({ value: {value: this._manager.height}, property: DriveToolProperties.height, editorPosition: { rowPriority: 1, columnIndex: 1 }});
    toolSettings.push({ value: {value: this._manager.lateralOffset}, property: DriveToolProperties.lateralOffset, editorPosition: { rowPriority: 2, columnIndex: 1 }});
    toolSettings.push({ value: {value: this._manager.speed * 3.6}, property: DriveToolProperties.speed, editorPosition: { rowPriority: 3, columnIndex: 1 }});
    toolSettings.push({ value: {value: this._manager.fov}, property: DriveToolProperties.fov, editorPosition: { rowPriority: 4, columnIndex: 1 }});
    toolSettings.push({ value: {value: this._manager.progress}, property: DriveToolProperties.progress, editorPosition: { rowPriority: 5, columnIndex: 1 }});
    toolSettings.push({ value: {value: this._manager.targetDistance}, property: DriveToolProperties.targetDistance, editorPosition: { rowPriority: 6, columnIndex: 1 }});
    return toolSettings;
  }

  private syncAllSettings() {
    this.syncToolSettingsProperties([
      { value: { value: this._manager.height}, propertyName: DriveToolProperties.height.name },
      { value: { value: this._manager.lateralOffset}, propertyName: DriveToolProperties.lateralOffset.name },
      { value: { value: this._manager.speed * 3.6}, propertyName: DriveToolProperties.speed.name },
      { value: { value: this._manager.fov}, propertyName: DriveToolProperties.fov.name },
      { value: { value: this._manager.progress}, propertyName: DriveToolProperties.progress.name },
      { value: { value: this._manager.targetDistance}, propertyName: DriveToolProperties.targetDistance.name },
    ]);
  }

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

    if (undefined === this._manager.targetId)
      this._manager.targetId = context.viewport.iModel.transientIds.next;

    if (this._manager.target) {
      const builder = context.createGraphicBuilder(GraphicType.WorldDecoration, undefined, this.manager.targetId);
      builder.setSymbology(context.viewport.getContrastToBackgroundColor(), ColorDef.red, 1);
      builder.addShape(this._manager.getPointsShape());

      context.addDecorationFromBuilder(builder);
    }
  }

  protected provideToolAssistance(): void {
    const mainInstruction = ToolAssistance.createInstruction(ToolAssistanceImage.CursorClick, "Select an object");

    const toggleMovementInstruction = ToolAssistance.createKeyboardInstruction(ToolAssistance.createKeyboardInfo(["T"]), "Toggle movement");
    const reverseInstruction = ToolAssistance.createKeyboardInstruction(ToolAssistance.createKeyboardInfo(["R"]), "Reverse direction");
    const speedInstruction = ToolAssistance.createKeyboardInstruction(ToolAssistance.createKeyboardInfo(["W", "S"]), "Adjust speed");
    const heightInstruction = ToolAssistance.createKeyboardInstruction(ToolAssistance.createKeyboardInfo(["Q", "E"]), "Adjust height");
    const lateralOffsetInstruction = ToolAssistance.createKeyboardInstruction(ToolAssistance.createKeyboardInfo(["A", "D"]), "Adjust lateral offset");
    const toggleTargetInstruction = ToolAssistance.createKeyboardInstruction(ToolAssistance.createKeyboardInfo(["L"]), "Toggle target");
    const fovInstruction = ToolAssistance.createInstruction(ToolAssistanceImage.MouseWheel, "Adjust Fov");

    const section1 = ToolAssistance.createSection([toggleMovementInstruction, reverseInstruction, speedInstruction, lateralOffsetInstruction, heightInstruction, fovInstruction, toggleTargetInstruction]);
    const instructions = ToolAssistance.createInstructions(mainInstruction, [section1]);
    IModelApp.notifications.setToolAssistance(instructions);
  }

  public async onDataButtonDown(ev: BeButtonEvent): Promise<EventHandled> {
    const hit = await IModelApp.locateManager.doLocate(new LocateResponse(), true, ev.point, ev.viewport, ev.inputSource);
    if (hit?.sourceId) {
      await this._manager.setSelectedCurve(hit.sourceId);
    }
    return EventHandled.Yes;
  }

  public async onKeyTransition(_wentDown: boolean, _keyEvent: KeyboardEvent): Promise<EventHandled> {
    if (this._keyIntervalId) {
      clearTimeout(this._keyIntervalId);
    }
    if (_wentDown) {
      switch (_keyEvent.key) {
        case "t":
          this._manager.toggleMovement();
          break;
        case "r":
          this._manager.reverseCurve();
          break;
        case "l":
          this._manager.toggleTarget();
          break;
        case "w":
          this._keyIntervalId = setInterval(() => {
            this._manager.speed += DriveToolConfig.speedStep;
            this.syncAllSettings();
          }, this._keyIntervalTime);
          break;
        case "s":
          this._keyIntervalId = setInterval(() => {
            this._manager.speed -= DriveToolConfig.speedStep;
            this.syncAllSettings();
          }, this._keyIntervalTime);
          break;
        case "a":
          this._keyIntervalId = setInterval(() => {
            this._manager.lateralOffset -= DriveToolConfig.lateralOffsetStep;
            this.syncAllSettings();
          }, this._keyIntervalTime);
          break;
        case "d":
          this._keyIntervalId = setInterval(() => {
            this._manager.lateralOffset += DriveToolConfig.lateralOffsetStep;
            this.syncAllSettings();
          }, this._keyIntervalTime);
          break;
        case "q":
          this._keyIntervalId = setInterval(() => {
            this._manager.height -= DriveToolConfig.heightStep;
            this.syncAllSettings();
          }, this._keyIntervalTime);
          break;
        case "e":
          this._keyIntervalId = setInterval(() => {
            this._manager.height += DriveToolConfig.heightStep;
            this.syncAllSettings();
          }, this._keyIntervalTime);
          break;

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
    this.syncAllSettings();
    return EventHandled.Yes;
  }

  public async onMouseMotion(ev: BeButtonEvent): Promise<void> {
    const hit = await IModelApp.locateManager.doLocate(new LocateResponse(), true, ev.point, ev.viewport, ev.inputSource);
    this._manager.updateMouseDecoration(ev.viewPoint, hit);
  }

  public async onResetButtonUp(_ev: BeButtonEvent): Promise<EventHandled> {
    this.onReinitialize();
    return EventHandled.No;
  }

  public onCleanup(): void {
    this._manager.stop();
  }

  public onRestartTool(): void {
    const tool = new DriveTool();
    if (!tool.run())
      this.exitTool();
  }

  public static get driveToolItemDef() {
    return new ToolItemDef({
      toolId: DriveTool.toolId,
      iconSpec: DriveTool.iconSpec,
      label: () => "Drive Tool",
      description: () => "Drive Tool Desc",
      execute: () => {
        IModelApp.tools.run(DriveTool.toolId);
      },
    });
  }
}
