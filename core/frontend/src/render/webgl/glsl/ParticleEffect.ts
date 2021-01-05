/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module WebGL
 */

import { ParticleEffectBuilderParams } from "../../effects/ParticleEffectBuilder";
import { AttributeDetails } from "../AttributeMap";
import { FragmentShaderComponent, ProgramBuilder, VariableType, VertexShaderComponent } from "../ShaderBuilder";
import { assignFragColor } from "./Fragment";

// Implementation of vec4 computePosition(vec4 rawPos) for compute shader.
// rawPos is the same as a_pos, and the return value doesn't matter (we're doing transform feedback).
const computeParticle = `
  v_age = a_age + u_deltaMillis;
  if (v_age >= v_lifetime) {
    v_age = 0.0;
    initializeParticle();
  } else {
    v_lifetime = a_lifetime;
    updateParticle(u_deltaMillis);
  }

  return rawPos;
`;

// ###TODO
const pseudoRandom = `
  float pseudoRandom() {
    return 0.5;
  }
`;

const computePosition = `
  effectMain();
  return rawPos;
`;

/** @internal */
export function createParticleComputeBuilder(params: ParticleEffectBuilderParams, attributes: Map<string, AttributeDetails>): ProgramBuilder {
  const builder = new ProgramBuilder(attributes);
  builder.setDebugDescription(`Particle Compute: ${params.name}`);

  const vert = builder.vert;
  if (params.source.compute.pseudoRandom)
    vert.addFunction(pseudoRandom);

  if (params.source.compute.prelude)
    vert.addFunction(params.source.compute.prelude);

  vert.addFunction("void initializeParticle()", params.source.compute.initialize);
  vert.addFunction("void updateParticle(float deltaMillis)", params.source.compute.update);

  vert.set(VertexShaderComponent.ComputePosition, computeParticle);
  builder.addUniform("u_deltaMillis", VariableType.Float, (prog) => {
    prog.addProgramUniform("u_deltaMillis", (uniform, _progParams) => {
      uniform.setUniform1f(0); // ###TODO
    });
  });

  // The fragment shader is irrelevant for transform feedback.
  const frag = builder.frag;
  frag.set(FragmentShaderComponent.CheckForEarlyDiscard, "return true;");
  frag.set(FragmentShaderComponent.ComputeBaseColor, "return vec4(1.0);");
  frag.set(FragmentShaderComponent.AssignFragData, assignFragColor);

  return builder;
}

/** @internal */
export function createParticleRenderBuilder(params: ParticleEffectBuilderParams, attributes: Map<string, AttributeDetails>): ProgramBuilder {
  const builder = new ProgramBuilder(attributes);
  builder.setDebugDescription(`$Particle Render: ${params.name}`);

  builder.vert.addFunction(params.source.render.vertex);
  builder.vert.set(VertexShaderComponent.ComputePosition, computePosition);

  builder.frag.addFunction(params.source.render.fragment);
  builder.frag.set(FragmentShaderComponent.ComputeBaseColor, "return effectMain();");
  builder.frag.set(FragmentShaderComponent.AssignFragData, assignFragColor);

  return builder;
}
