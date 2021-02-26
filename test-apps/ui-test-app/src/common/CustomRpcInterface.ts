/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { RpcInterface, IModelRpcProps, RpcManager } from "@bentley/imodeljs-common";
import { Id64String } from "@bentley/imodeljs-common/node_modules/@bentley/bentleyjs-core/lib/Id";
import { IModelJson, Path } from "@bentley/imodeljs-common/node_modules/@bentley/geometry-core";

/** Custom RPC interface. */
export abstract class CustomRpcInterface extends RpcInterface {
  /** The immutable name of the interface. */
  public static readonly interfaceName = "CustomRpcInterface";

  /** The semantic version of the interface. */
  public static interfaceVersion = "1.0.0";

  /** Returns the CustomRpcInterface instance for the frontend. */
  public static getClient(): CustomRpcInterface { return RpcManager.getClientForInterface(CustomRpcInterface); }

  /** Finds linear geometry inside the element's GeometryStream and return it. */
  public async queryPath(_iModelRpcProps: IModelRpcProps, _elementId: Id64String): Promise<IModelJson.GeometryProps | undefined> {
    return this.forward(arguments);
  }
}

/** Utilities for CustomRpc. */
export class CustomRpcUtilities {
  /** Deserializes the input as a Path. Returns undefined when invalid. */
  public static parsePath(data?: IModelJson.GeometryProps): Path | undefined {
    const parsed = IModelJson.Reader.parse(data);
    if (parsed instanceof Path)
      return parsed;

    return undefined;
  }
}
