/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { RpcInterface, IModelRpcProps, RpcManager, RpcInterfaceDefinition, ElementLoadProps, GeometryStreamIterator } from "@bentley/imodeljs-common";
import { GeometricElement3d, IModelDb } from "@bentley/imodeljs-backend";
import { Id64String } from "@bentley/bentleyjs-core";
import { CurveChain, IModelJson, Loop, Path } from "@bentley/geometry-core";
import { CustomRpcInterface } from "../common/CustomRpcInterface";

export class CustomRpcImpl extends RpcInterface implements CustomRpcInterface {
  public static register(): RpcInterfaceDefinition { RpcManager.registerImpl(CustomRpcInterface, CustomRpcImpl); return CustomRpcInterface; }

  public async queryPath(iModelRpcProps: IModelRpcProps, elementId: Id64String): Promise<IModelJson.GeometryProps | undefined> {

    try {
      const db = IModelDb.findByKey(iModelRpcProps.key);

      const element = db.elements.getElement({ id: elementId, wantGeometry: true });
      if (!(element instanceof GeometricElement3d) || undefined === element.geom)
        return undefined;

      const iterator = GeometryStreamIterator.fromGeometricElement3d(element);

      // Iterate on every piece of geometry this element has
      for (const entry of iterator) {
        if (entry.primitive.type !== "geometryQuery")
          continue;

        let path: Path;
        const geometry = entry.primitive.geometry;

        if (geometry.geometryCategory === "curvePrimitive")
          path = Path.create(geometry);
        else if (geometry.geometryCategory === "curveCollection" && geometry instanceof CurveChain)
          path = Path.create(...geometry.children);
        else
          continue;

        return IModelJson.Writer.toIModelJson(path);
      }

      // No suitable geometry found
      return undefined;

    } catch (e) {
      console.log(e);
      return undefined;
    }
  }

} // CustomRpcImpl
