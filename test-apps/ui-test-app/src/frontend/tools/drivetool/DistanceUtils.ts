/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { Point3d, Vector3d } from "@bentley/geometry-core";


export class DistanceUtils {

  // TODO: replace this by a proper distance calculator
  public static calculateDistance(origin: Point3d, target: Point3d): number {
    return Vector3d.createFrom(target.minus(origin))?.distance(Vector3d.create(0, 0, 0));
  }
}
