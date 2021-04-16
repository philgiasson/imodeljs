/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { Point3d, Vector3d } from "@bentley/geometry-core";

export class ShapeUtils {

  /**
   * Calculate points positions for a octagon 2d shape
   * @param vectorDirection vector perpendicular shape field
   * @param position of shape in world coordinates
   * @param size of octagon
   * @returns array of Point3d representing shape
   */
  public static get2dOctagonPoints(vectorDirection: Vector3d, position: Point3d, size: number): Point3d[] {
    const vectorUp = new Vector3d(0, 0, 1);
    const vectorLeft = vectorUp.crossProduct(vectorDirection);
    const vectorRight = vectorLeft.scale(-1);

    const pos1 = position.plus(vectorLeft.scale(size / 4));
    const pos2 = position.plus(vectorLeft.scale(size / 2)).plus(vectorUp.scale(size / 4));
    const pos3 = pos2.plus(vectorUp.scale(size / 2));
    const pos4 = pos1.plus(vectorUp.scale(size));
    const pos8 = position.plus(vectorRight.scale(size / 4));
    const pos7 = position.plus(vectorRight.scale(size / 2)).plus(vectorUp.scale(size / 4));
    const pos6 = pos7.plus(vectorUp.scale(size / 2));
    const pos5 = pos8.plus(vectorUp.scale(size));

    return [pos1, pos2, pos3, pos4, pos5, pos6, pos7, pos8];
  }
}
