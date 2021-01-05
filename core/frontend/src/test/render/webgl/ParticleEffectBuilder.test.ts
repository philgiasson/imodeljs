/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import { expect } from "chai";
import { IModelApp } from "../../../IModelApp";
import { System } from "../../../render/webgl/System";

function countTechniques(): number {
  return System.instance.techniques.numTechniques;
}

function expectNumTechniques(expected: number): void {
  expect(countTechniques()).to.equal(expected);
}

describe("ParticleEffectBuilder", () => {
  // Particle effects use transform feedback, which is not available in WebGL 1.
  function isSupported() {
   return System.instance.isWebGL2;
  }

  before(async () => await IModelApp.startup());
  after(async () => await IModelApp.shutdown());

  it("creates a simple particle effect", () => {
    if (!isSupported())
      return;

    const initialize = `
      v_lifetime = pseudoRandom() + 1.0;
      v_pos = vec3(0.0);
    `;

    const params = {
      name: "simple",
      source: {
        compute: {
          initialize,
          update: "updatePosition();",
          prelude: "void updatePosition() { v_pos = a_pos + 0.1; }",
          pseudoRandom: true,
        },
        render: {
          vertex: "void effectMain() { }",
          fragment: "vec4 effectMain() { return vec4(0.5); }",
        },
      },
    };

    const builder = IModelApp.renderSystem.createParticleEffectBuilder(params)!;
    expect(builder).not.to.be.undefined;

    const numTechniques = countTechniques();
    builder.finish();
    expectNumTechniques(numTechniques + 2);
  });

  it("creates a slightly more complex particle effect", () => {
    if (!isSupported())
      return;

    const initialize = `
      float theta = u_minTheta + pseudoRandom() * (u_maxTheta - u_minTheta);
      float x = cos(theta);
      float y = sin(theta);
      v_pos = vec3(u_origin, 0.0);
      v_lifetime = u_minAge + pseudoRandom() * (u_maxAge - u_minAge);
      v_velocity = vec2(x, y) * (u_minSpeed + pseudoRandom() * (u_maxSpeed - u_minSpeed));
    `;

    const update = `
      v_pos = a_pos + vec3(a_velocity, 0.0) * deltaMillis;
      v_velocity = a_velocity + u_gravity * deltaMillis + u_force * deltaMillis;
    `;

    const fragment = `
      vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ) {
        return a + b*cos( 6.28318*(c*t+d) );
      }

      vec4 effectMain() {
        float t = v_age / v_lifetime;
        return vec4(
          palette(t,
            vec3(0.5,0.5,0.5),
            vec3(0.5,0.5,0.5),
            vec3(1.0,0.7,0.4),
            vec3(0.0,0.15,0.20)),
            1.0 - t);
      }
    `;

    const builder = IModelApp.renderSystem.createParticleEffectBuilder({
      name: "slightly more complex",
      source: {
        compute: {
          initialize,
          update,
          pseudoRandom: true,
        },
        render: {
          vertex:"void effectMain() { gl_PointSize = 1.0 + 6.0 * (1.0 - a_age/a_lifetime); }",
          fragment,
          fragmentProperties: ["age", "lifetime"],
        },
      },
    })!;

    expect(builder).not.to.be.undefined;
    builder.addProperty({ name: "velocity", type: "vec2" });

    builder.addUniform({ name: "u_minTheta", type: "float", bind: (uniform) => uniform.setUniform1f(Math.PI / 2 - 0.4) });
    builder.addUniform({ name: "u_maxTheta", type: "float", bind: (uniform) => uniform.setUniform1f(Math.PI / 2 + 0.4) });
    builder.addUniform({ name: "u_minAge", type: "float", bind: (uniform) => uniform.setUniform1f(1.01) });
    builder.addUniform({ name: "u_maxAge", type: "float", bind: (uniform) => uniform.setUniform1f(1.15) });
    builder.addUniform({ name: "u_minSpeed", type: "float", bind: (uniform) => uniform.setUniform1f(0.5) });
    builder.addUniform({ name: "u_maxSpeed", type: "float", bind: (uniform) => uniform.setUniform1f(1.0) });
    builder.addUniform({ name: "u_origin", type: "vec2", bind: (uniform) => uniform.setUniform2fv([100, 50]) });
    builder.addUniform({ name: "u_gravity", type: "vec2", bind: (uniform) => uniform.setUniform2fv([0, -0.8]) });
    builder.addUniform({ name: "u_force", type: "vec2", bind: (uniform) => uniform.setUniform2fv([-0.21, 0.4]) });

    const numTechniques = countTechniques();
    builder.finish();
    expect(countTechniques()).to.equal(numTechniques + 2);
  });

  it("throws if shader fails to compile", () => {
  });

  it("throws if an effect already exists by the same name", () => {
  });
});
