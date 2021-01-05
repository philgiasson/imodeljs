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

/** Snippets of GLSL source code used to implement a particle effect. The code should not declare uniforms, attributes, or varyings - those will be generated from
 * the [[ParticleEffectBuilder]].
 * @see [[ParticleEffectBuilderParams]].
 * @see [[RenderSystem.createParticleEffectBuilder]] to define a new particle effect.
 * @beta
 */
export interface ParticleEffectSource {
  /** GLSL source code for the vertex shader that computes a particle's properties.
   * A function to generate a pseudo-random number in [0..1] will be automatically included: `float pseudoRandom()`.
   */
  compute: {
    /** The body of a function `void initializeParticle()` that assigns values to all output properties of a newborn particle, excluding `v_age` but including `v_lifetime` and `v_position`. */
    initialize: string;
    /** The body of a function `void updateParticle(float deltaMillis)` that computes the particle's properties from the input attributes and `deltaMillis` and assigns them to the output varyings.
     * e.g., compute `v_position` from `a_position`.
     * @note `updateParticle()` needn't assign to `v_lifetime` - particle lifetimes typically remain fixed from birth.
     * @note `updateParticle()` should not assign to `v_age` nor check if the particle's lifetime has expired - this is handled automatically.
     */
    update: string;
    /** Any code that resides outside of `updateParticle()` and `initializeParticle()`, to be inserted before those two functions in the completed source code. */
    prelude?: string;
  },

  /** GLSL source code for the shader program that renders a particle. */
  render: {
    /** GLSL code including a function `void effectMain()` responsible for assigning to any varying variables used by the fragment shader.
     * @note Do not assign to `gl_Position` - it will be computed from `a_position`, which is the center of the particle.
     */
    vertex: string;
    /** GLSL code including a function `vec4 effectMain()` responsible for computing the color of the particle fragment.
     * @note Do not assign to `gl_FragColor` - the [[RenderSystem]] will take care of that.
     */
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
  /** By default, properties are only used by the effect's "compute" shader program. If `forRender` is true, the property will also be available within the "render" shader program. */
  forRender?: boolean;
}

/** A particle effect uses two shader programs:
 *  - A "compute" program that updates the properties of each particle and initializes the properties of newborn particles; and
 *  - A "render" program that draws the particles.
 * Most of the compute program's code is supplied by the author of the particle effect, while most of the render program's code is usually supplied by the [[RenderSystem]].
 * The two programs may need entirely different sets of uniforms, though some uniforms may be relevant to both programs.
 * As part of a [[ParticleUniformParams]] or [[ParticleUniformArrayParams]], the scope tells a [[ParticleEffectBuilder]] which program will use the uniform.
 * @see [[ParticleEffectBuilder.addUniform]] and [[ParticleEffectBuilder.addUniformArray]] to define a particle effect's uniform variables.
 * @beta
 */
export type ParticleUniformScope = "compute" | "render" | "both";

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

/** An interface used to construct and register with the [[IModelApp.renderSystem]] a custom particle effect.
 * Particle effects are used to render particle systems, which are collections of many small particles that animate to simulate phenomena like fire, smoke, rain, snow, etc.
 * Each particle in the system has a lifetime: a particle is born, animates, and then expires when its lifetime is exceeded, to be replaced with a newborn particle.
 * The system has a fixed maximum number of live particles. A particle effect defines the set of properties that all particles have in common - for example, position, velocity, transparency, etc.
 * It also defines global values that affect the particles - for example, gravity, wind, etc.
 *
 * The particle effect makes use of two WebGL shader programs:
 *  - A "compute" program responsible for updating the properties of each particle in the system and initializing the properties of newborn particles; and
 *  - a "render" program responsible for displaying the particles.
 * Most of the compute program's code is supplied by the author of the effect; most of the render program's code is supplied by the [[RenderSystem]].
 *
 * The properties of the particles are received as attributes by the "compute" vertex shader, and their updated values are output as varyings. The compute program's
 * fragment shader simply discards the fragments, as they are not rendered; but the output varyings' values are captured via transform feedback to serve as the inputs to the
 * next execution of the compute program. The particles' positions also serve as input to the "render" vertex shader.
 *
 * The following properties are predefined by the [[RenderSystem]] for all particle effects:
 *  - Position: the particle's current position in the particle system's local coordinate space. The effect author is responsible for initializing and updating each particle's position.
 *    - Input: `in vec3 a_position`
 *    - Output: `out vec3 v_position`
 *  - Age: the number of milliseconds for which the particle has been alive. The [[RenderSystem]] takes care of updating each particle's age and destroying the particle once it exceeds its lifetime.
 *    - Input: `in float a_age`
 *    - Output: `out float v_age`
 *  - Lifetime: the number of milliseconds for which the particle will live.  The effect author is responsible for initializing each new particle's lifetime.
 *    - Input: `in float a_lifetime`
 *    - Output: `out float v_lifetime`
 *
 * The "compute" vertex shader has access to a predefined function to produce a pseudo-random number in [0..1]: `highp float pseudoRandom()`.
 * @see [[ParticleEffectSource]] for details about defining the effect's GLSL implementation.
 * @beta
 */
export interface ParticleEffectBuilder<T> {
  addUniform: (params: ParticleUniformParams<T>) => void;

  addUniformArray: (params: ParticleUniformArrayParams<T>) => void;

  /** Adds a varying variable of the specified type to the effect's render shader program. */
  addVarying: (name: string, type: VaryingType) => void;

  /** Defines a property of the particle's within the particle system. The properties of all particles are updated each frame by the effect's "compute"
   * shader program before the particles are rendered. Each property produces an input attribute prefixed with "a_" and an output varying prefixed with "v_".
   * For example, if `params.name` is "velocity" and `params.type` is "vec3", then the vertex shader will contain:
   *  ```
   *  in vec3 a_velocity;
   *  out vec3 v_velocity;
   * ```
   * By default, particle properties are only included in the compute shader program; @see [[ParticlePropertyParams.forRender]] to make a property available to the "render" program as well.
   */
  addProperty: (params: ParticlePropertyParams) => void;

  finish: () => void;
}
