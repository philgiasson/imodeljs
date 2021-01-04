/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module Rendering
 */

import { UniformContext, UniformArrayParams, UniformParams } from "./Uniform";
import { VaryingType } from "./VaryingType";

/** The GLSL data types that can be used for properties of particles in a particle effect.
 * @see [[ParticleEffectBuilder.addProperty]] to define particle properties.
 * @beta
 */
export type ParticlePropertyType = "float" | "vec2" | "vec3" | "vec4";

/** Snippets of GLSL source code used to implement a particle effect.
 * @see [[ParticleEffectBuilderParams]].
 * @see [[RenderSystem.createParticleEffectBuilder]] to define a new particle effect.
 * @beta
 */
export interface ParticleEffectSource {
  particle: {
    initialize: string;
    update: string;
  },
  render: {
    vertex: string;
    fragment: string;
  }
}

/** Parameters used to create a [[ParticleEffectBuilder]].
 * @beta
 */
export interface ParticleEffectBuilderParams {
  name: string;
  source: ParticleEffectSource;
}

/** Context supplied when computing the values of uniform variables just before updating and rendering a particle system.
 * The type `T` is typically an interface that holds or can compute the value of each uniform. An instance of `T` typically
 * correlates with an instance of the particle effect; many such instances can exist with the same set of uniforms but different
 * values for each.
 * @see [[ParticleEffectBuilder.addUniform]] and [[ParticleEffectBuilder.addUniformArray]] to define a particle effect's uniforms.
 * @beta
 */
export interface ParticleUniformContext<T> extends UniformContext {
  instance: T;
}

/** Describes a property of the particles within a particle system.
 * @see [[ParticleEffectBuilder.addProperty]] to define a particle effect's properties.
 * @beta
 */
export interface ParticlePropertyParams {
  /** The base name of the property. Must be unique among all properties of the system.
   * @see [[ParticleEffectBuilder.addProperty]] for a description of how  the base name is used in the shader program.
   */
  name: string;
  /** The GLSL type of the corresponding attribute and varying variable. */
  type: ParticlePropertyType;
  /** By default, properties are only used by the effect's "update" shader program. If `forRender` is true, the property will also be available within the "render" shader program. */
  forRender?: boolean;
}

/** A particle effect uses two shader programs:
 *  - An "update" program that updates the properties of each particle and initializes the properties of newborn particles; and
 *  - A "render" program that draws the particles.
 * Most of the update program's code is supplied by the author of the particle effect, while most of the render program's code is usually supplied by the [[RenderSystem]].
 * The two programs may need entirely different sets of uniforms, though some uniforms may be relevant to both programs.
 * As part of a [[ParticleUniformParams]] or [[ParticleUniformArrayParams]], the scope tells a [[ParticleEffectBuilder]] which program will use the uniform.
 * @see [[ParticleEffectBuilder.addUniform]] and [[ParticleEffectBuilder.addUniformArray]] to define a particle effect's uniform variables.
 * @beta
 */
export type ParticleUniformScope = "update" | "render" | "both";

/** Parameters used to define a uniform variable for a particle effect.
 * @see [[ParticleEffectBuilder.addUniform]] to define a uniform variable.
 * @beta
 */
export type ParticleUniformParams<T> = UniformParams<ParticleUniformContext<T>> & { scope: ParticleUniformScope };

/** Parameters used to define an array of uniform variables for a particle effect.
 * @see [[ParticleEffectBuilder.addUniformArray]] to define a uniform array.
 * @beta
 */
export type ParticleUniformArrayParams<T> = UniformArrayParams<ParticleUniformContext<T>> & { scope: ParticleUniformScope };

/** ###TODO
 * @beta
 */
export interface ParticleEffectBuilder<T> {
  addUniform: (params: ParticleUniformParams<T>) => void;

  addUniformArray: (params: ParticleUniformArrayParams<T>) => void;

  /** Adds a varying variable of the specified type to the effect's render shader program. */
  addVarying: (name: string, type: VaryingType) => void;

  /** Defines a property of the particle's within the particle system. The properties of all particles are updated each frame by the effect's "update"
   * shader program before the particles are rendered. Each property produces an input attribute prefixed with "a_" and an output varying prefixed with "v_".
   * For example, if `params.name` is "velocity" and `params.type` is "vec3", then the vertex shader will contain:
   *  ```
   *  in vec3 a_velocity;
   *  out vec3 v_velocity;
   * ```
   * By default, particle properties are only included in the update shader program; @see [[ParticlePropertyParams.forRender]] to make a property available to the "render" program as well.
   */
  addProperty: (params: ParticlePropertyParams) => void;

  finish: () => void;
}
