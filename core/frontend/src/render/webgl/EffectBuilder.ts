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
export function getEffectVariableType(type: UniformType): VariableType {
  switch (type) {
    case "bool": return VariableType.Boolean;
    case "int": return VariableType.Int;
    case "float": return VariableType.Float;
    case "vec2": return VariableType.Vec2;
    case "vec3": return VariableType.Vec3;
    case "vec4": return VariableType.Vec4;
  }
}
