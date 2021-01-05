/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module WebGL
 */

import { VaryingType } from "../effects/VaryingType";
import {
  ParticleEffectBuilder, ParticleEffectBuilderParams, ParticlePropertyParams, ParticleUniformArrayParams, ParticleUniformContext, ParticleUniformParams,
} from "../effects/ParticleEffectBuilder";
import { TechniqueId } from "./TechniqueId";
import { AttributeDetails, AttributeMap } from "./AttributeMap";
import { ProgramBuilder } from "./ShaderBuilder";
import { ShaderProgramParams } from "./DrawCommand";
import { CompileStatus } from "./ShaderProgram";
import { SingularTechnique } from "./Technique";
import { getEffectVariableType } from "./EffectBuilder";
import { createParticleComputeBuilder, createParticleRenderBuilder } from "./glsl/ParticleEffect";

import { System } from "./System";

// ###TODO: Temporary until we can access current particle system on Target.
function getUniformContext<T>(params: ShaderProgramParams): ParticleUniformContext<T> {
  const instance = { };
  return {
    ... params.target.screenSpaceEffectContext,
    instance: instance as unknown as T,
  };
}

class Builder<T> implements ParticleEffectBuilder<T> {
  private readonly _name: string;
  private readonly _attributes = new Map<string, AttributeDetails>();
  private readonly _compute: ProgramBuilder;
  private readonly _render: ProgramBuilder;

  public constructor(params: ParticleEffectBuilderParams) {
    this._name = params.name;
    this._compute = createParticleComputeBuilder(params, this._attributes);
    this._render = createParticleRenderBuilder(params, this._attributes);

    this.addProperty({
      name: "pos",
      type: "vec3",
      forRender: true,
    });

    this.addProperty({ name: "age", type: "float" });
    this.addProperty({ name: "lifetime", type: "float" });
  }

  public addUniform(params: ParticleUniformParams<T>): void {
    const { name, bind } = { ...params };
    const type = getEffectVariableType(params.type);

    const add = (builder: ProgramBuilder) => {
      builder.addUniform(name, type, (prog) => {
        prog.addProgramUniform(name, (uniform, progParams) => {
          bind(uniform, getUniformContext<T>(progParams));
        });
      });
    };


    if ("render" !== params.scope)
      add(this._compute);

    if ("compute" !== params.scope)
      add(this._render);
  }

  public addUniformArray(params: ParticleUniformArrayParams<T>): void {
    const { name, bind, length } = { ...params };
    const type = getEffectVariableType(params.type);

    const add = (builder: ProgramBuilder) => {
      builder.addUniformArray(name, type, length, (prog) => {
        prog.addProgramUniform(name, (uniform, progParams) => {
          bind(uniform, getUniformContext<T>(progParams));
        });
      });
    };

    if ("render" !== params.scope)
      add(this._compute);

    if ("compute" !== params.scope)
      add(this._render);
  }

  public addVarying(name: string, type: VaryingType): void {
    this._render.addVarying(name, getEffectVariableType(type));
  }

  public addProperty(params: ParticlePropertyParams): void {
    const type = getEffectVariableType(params.type);
    this._compute.addVarying(`v_${params.name}`, type);
    if (params.forRender)
      this._render.addVarying(`v_${params.name}`, type);

    this._attributes.set(`a_${params.name}`, {
      location: this._attributes.size,
      type,
    });
  }

  public finish(): void {
    const system = System.instance;
    const context = system.context;
    const compute = this._compute.buildProgram(context);

    if (CompileStatus.Success !== compute.compile())
      throw new Error(`Failed to compile compute shader program for particle effect "${this._name}"`);

    // ###TODO Allow user to specify whether particles are opaque, transparent, or a mix of both;
    // produce appropriate shaders.
    const render = this._render.buildProgram(context);
    console.log(render.vertSource);
    if (CompileStatus.Success !== render.compile())
      throw new Error(`Failed to compile render shader program for particle effect "${this._name}"`);

    const computeTech = new SingularTechnique(compute);
    const renderTech = new SingularTechnique(render);
    const computeId = system.techniques.addDynamicTechnique(computeTech, `${this._name}_compute`);
    const renderId = system.techniques.addDynamicTechnique(renderTech, this._name);

    AttributeMap.addEntryFromUninstancedDetails(computeId, this._attributes);
    AttributeMap.addEntryFromUninstancedDetails(renderId, this._attributes);

    const effect = new ParticleEffect(this._name, computeId, renderId);
    system.particleEffects.add(effect);
  }
}

class ParticleEffect {
  public readonly computeTechniqueId: TechniqueId;
  public readonly renderTechniqueId: TechniqueId;
  public readonly name: string;

  public constructor(name: string, compute: TechniqueId, render: TechniqueId) {
    this.name = name;
    this.computeTechniqueId = compute;
    this.renderTechniqueId = render;
  }
}

/** @internal */
export class ParticleEffects {
  private readonly _effects = new Map<string, ParticleEffect>();

  public constructor() {
    // ###TODO
  }

  public dispose(): void {
    // ###TODO
  }

  public add(effect: ParticleEffect): void {
    if (undefined !== this._effects.get(effect.name))
      throw new Error(`Particle effect "${effect.name}" is already registered.`);

    this._effects.set(effect.name, effect);
  }

  // ###TODO...
}

/** @internal */
export function createParticleEffectBuilder<T>(params: ParticleEffectBuilderParams): ParticleEffectBuilder<T> | undefined {
  return System.instance.isWebGL2 ? new Builder<T>(params) : undefined;
}
