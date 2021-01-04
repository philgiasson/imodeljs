/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module Rendering
 */

import { Viewport } from "../../Viewport";
import { UniformContext, UniformArrayParams, UniformParams } from "./Uniform";
import { VaryingType } from "./VaryingType";

export interface ParticleEffectSource {
  update: string;
  render: {
    vertex: string;
    fragment: string;
  }
}

export interface ParticleEffectBuilderParams {
  name: string;
  source: ParticleEffectSource;
}

export interface ParticleEffectContext<T> {
  viewport: Viewport;
  properties: T;
}

export interface ParticleUniformContext<T> extends UniformContext {
  properties: T;
}

export type ParticleUniformScope = "update" | "render" | "both";
export type ParticleUniformParams<T> = UniformParams<ParticleUniformContext<T>> & { scope: ParticleUniformScope };
export type ParticleUniformArrayParams<T> = UniformArrayParams<ParticleUniformContext<T>> & { scope: ParticleUniformScope };

export interface ParticleEffectBuilder<T> {
  addUniform: (params: ParticleUniformParams<T>) => void;

  addUniformArray: (params: ParticleUniformArrayParams<T>) => void;

  addVarying: (name: string, type: VaryingType) => void;

  finish: () => void;
}
