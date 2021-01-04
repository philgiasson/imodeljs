/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module WebGL
 */

import { VaryingType } from "../effects/VaryingType";
import { UniformType } from "../effects/Uniform";
import { VariableType } from "./ShaderBuilder";

/** @internal */
export function getUniformVariableType(type: UniformType): VariableType {
  switch (type) {
    case UniformType.Bool: return VariableType.Boolean;
    case UniformType.Int: return VariableType.Int;
    case UniformType.Float: return VariableType.Float;
    case UniformType.Vec2: return VariableType.Vec2;
    case UniformType.Vec3: return VariableType.Vec3;
    case UniformType.Vec4: return VariableType.Vec4;
  }
}

/** @internal */
export function getVaryingVariableType(type: VaryingType): VariableType {
  switch (type) {
    case VaryingType.Float: return VariableType.Float;
    case VaryingType.Vec2: return VariableType.Vec2;
    case VaryingType.Vec3: return VariableType.Vec3;
    case VaryingType.Vec4: return VariableType.Vec4;
  }
}
