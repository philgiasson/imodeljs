/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { PropertyDescription } from "@bentley/ui-abstract";

export class DriveToolProperties {
  public static height: PropertyDescription = {name: "height", displayLabel: "Height (m)", typename: "number"};
  public static lateralOffset: PropertyDescription = {name: "lateralOffset", displayLabel: "Lateral Offset (m)", typename: "number"};
  public static speed: PropertyDescription = {name: "speed", displayLabel: "Speed (km/h)", typename: "number"};
  public static fov: PropertyDescription = {name: "fov", displayLabel: "Fov (deg)", typename: "number"};
  public static progress: PropertyDescription = {name: "progress", displayLabel: "Progress (%)", typename: "number"};
}
