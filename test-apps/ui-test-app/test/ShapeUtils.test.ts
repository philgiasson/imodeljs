/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { Point3d, Vector3d } from "@bentley/geometry-core";
import { expect } from "chai";
import { ShapeUtils } from "../src/frontend/tools/drivetool/ShapeUtils";

describe("ShapeUtils", function () {

  describe("Get Octagon Points", function () {
    it("should return expected points", function () {
      const point = new Point3d(0, 0, 0);
      const direction = new Vector3d(1, 0, 0);
      const size = 4;

      const octagonPoints = ShapeUtils.getOctagonPoints(point, direction, size);

      expect(octagonPoints).to.deep.equal([
        new Point3d(0, 1, 0),
        new Point3d(0, 2, 1),
        new Point3d(0, 2, 3),
        new Point3d(0, 1, 4),
        new Point3d(0, -1, 4),
        new Point3d(0, -2, 3),
        new Point3d(0, -2, 1),
        new Point3d(0, -1, 0)
      ])
    });
  });
})
