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
  before(async () => await IModelApp.startup());
  after(async () => await IModelApp.shutdown());

  it("creates a simple particle effect", () => {
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
  });

  it("throws if shader fails to compile", () => {
  });

  it("throws if an effect already exists by the same name", () => {
  });
});
