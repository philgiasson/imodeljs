/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { CanvasDecoration } from "@bentley/imodeljs-frontend";

export class DetectionZoneDecoration implements CanvasDecoration {
  public x?: number;
  public y?: number;
  public w?: number;
  public h?: number;

  public setRectangle(x: number, y: number, w: number, h: number) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  public drawDecoration(ctx: CanvasRenderingContext2D) {
    if (this.x && this.y && this.w && this.h)
      ctx.strokeRect(this.x, this.y, this.w, this.h);
  }
}
