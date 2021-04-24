/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { DriveToolManager } from "../src/frontend/tools/drivetool/DriveToolManager";
import { expect } from "chai";
import { DistanceDecoration } from "../src/frontend/tools/drivetool/DistanceDecoration";
import { DriveToolConfig } from "../src/frontend/tools/drivetool/DriveToolConfig";
import { RectangleDecoration } from "../src/frontend/tools/drivetool/RectangleDecoration";

describe("DriveToolManager", function() {

  const distanceDecoration = new DistanceDecoration();
  const detectionZoneDecoration = new RectangleDecoration();
  const manager = new DriveToolManager(distanceDecoration, detectionZoneDecoration);

  describe("Constructor", function() {
    it("should return instance", function() {
      expect(manager).to.be.not.null;
    });
  });

  describe("Height", function() {
    it("respects min value", function() {
      manager.height = DriveToolConfig.heightMin - 1;
      expect(manager.height).to.be.eq(DriveToolConfig.heightMin);
    });
    it("respects max value", function() {
      manager.height = DriveToolConfig.heightMax + 1;
      expect(manager.height).to.be.eq(DriveToolConfig.heightMax);
    });
  });

  describe("Speed", function() {
    it("respects min value", function() {
      manager.speed = DriveToolConfig.speedMin - 1;
      expect(manager.speed).to.be.eq(DriveToolConfig.speedMin);
    });
    it("respects max value", function() {
      manager.speed = DriveToolConfig.speedMax + 1;
      expect(manager.speed).to.be.eq(DriveToolConfig.speedMax);
    });
  });

  describe("Fov", function() {
    it("respects min value", function() {
      manager.fov = DriveToolConfig.fovMin - 1;
      expect(manager.fov).to.be.eq(DriveToolConfig.fovMin);
    });
    it("respects max value", function() {
      manager.fov = DriveToolConfig.fovMax + 1;
      expect(manager.fov).to.be.eq(DriveToolConfig.fovMax);
    });
  });

  describe("Lateral Offset", function() {
    it("respects min value", function() {
      manager.lateralOffset = DriveToolConfig.lateralOffsetMin - 1;
      expect(manager.lateralOffset).to.be.eq(DriveToolConfig.lateralOffsetMin);
    });
    it("respects max value", function() {
      manager.lateralOffset = DriveToolConfig.lateralOffsetMax + 1;
      expect(manager.lateralOffset).to.be.eq(DriveToolConfig.lateralOffsetMax);
    });
  });

  describe("Progress", function() {
    it("respects min value", function() {
      manager.progress = -1;
      expect(manager.progress).to.be.eq(0);
    });
    it("respects max value", function() {
      manager.progress = 2;
      expect(manager.progress).to.be.eq(1);
    });
  });
});
