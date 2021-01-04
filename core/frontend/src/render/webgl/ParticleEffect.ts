/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module WebGL
 */

import { VaryingType } from "../effects/VaryingType";
import {
  ParticleEffectBuilder, ParticleEffectBuilderParams, ParticlePropertyParams, ParticleUniformArrayParams, ParticleUniformParams,
} from "../effects/ParticleEffectBuilder";
import { getUniformVariableType, getVaryingVariableType } from "./EffectBuilder";

import { System } from "./System";

class Builder<T> implements ParticleEffectBuilder<T> {
  private readonly _name: string;
  // private readonly _updater: ProgramBuilder;
  // private readonly _renderer: ProgramBuilder;

  public constructor(params: ParticleEffectBuilderParams) {
    this._name = params.name;
  }

  public addUniform(_params: ParticleUniformParams<T>): void {
    // this._updater = createParticleEffectUpdateBuilder(params);
    // this._renderer = createParticleEffectRenderBuilder(params);
  }

  public addUniformArray(_params: ParticleUniformArrayParams<T>): void {
  }

  public addVarying(_name: string, _type: VaryingType): void {
  }

  public addProperty(_params: ParticlePropertyParams): void {
  }

  public finish(): void {
  }
}

/** @internal */
export function createParticleEffectBuilder<T>(params: ParticleEffectBuilderParams): ParticleEffectBuilder<T> | undefined {
  return System.instance.isWebGL2 ? new Builder<T>(params) : undefined;
}
