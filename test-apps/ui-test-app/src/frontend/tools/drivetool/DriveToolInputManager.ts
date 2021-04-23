/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { BeWheelEvent } from "@bentley/imodeljs-frontend";
import { DriveToolManager } from "./DriveToolManager";
import { DriveToolConfig } from "./DriveToolConfig";

export class DriveToolInputManager {

  private _keyIntervalId?: NodeJS.Timeout;
  private _keyIntervalTime = 50;

  constructor(private _manager: DriveToolManager) {
  }

  /**
   * Handles a key transition and trigger the corresponding action on the drive tool manager
   * @param wentDown indicates if key was pressed or released
   * @param key that was pressed
   * @param callback function to call when a value was modified
   */
  public handleKeyTransition(wentDown: boolean, key: string, callback: () => void): void {
    if (this._keyIntervalId) {
      clearTimeout(this._keyIntervalId);
    }
    if (wentDown) {
      switch (key) {
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
            callback();
          }, this._keyIntervalTime);
          break;
        case "s":
          this._keyIntervalId = setInterval(() => {
            this._manager.speed -= DriveToolConfig.speedStep;
            callback();
          }, this._keyIntervalTime);
          break;
        case "a":
          this._keyIntervalId = setInterval(() => {
            this._manager.lateralOffset -= DriveToolConfig.lateralOffsetStep;
            callback();
          }, this._keyIntervalTime);
          break;
        case "d":
          this._keyIntervalId = setInterval(() => {
            this._manager.lateralOffset += DriveToolConfig.lateralOffsetStep;
            callback();
          }, this._keyIntervalTime);
          break;
        case "q":
          this._keyIntervalId = setInterval(() => {
            this._manager.height -= DriveToolConfig.heightStep;
            callback();
          }, this._keyIntervalTime);
          break;
        case "e":
          this._keyIntervalId = setInterval(() => {
            this._manager.height += DriveToolConfig.heightStep;
            callback();
          }, this._keyIntervalTime);
          break;

      }
    }
  }

  /**
   * Handles onMouseWheel events to change fov value
   * @param ev mouse wheel scroll event
   * @param callback function to call when data is modified
   */
  public handleMouseWheel(ev: BeWheelEvent, callback: () => void): void {
    if (ev.wheelDelta > 0) {
      this._manager.fov -= DriveToolConfig.fovStep;
    } else if (ev.wheelDelta < 0) {
      this._manager.fov += DriveToolConfig.fovStep;
    }
    callback();
  }
}
