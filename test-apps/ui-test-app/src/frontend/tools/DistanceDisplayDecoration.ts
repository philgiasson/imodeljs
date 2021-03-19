/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { CanvasDecoration } from "@bentley/imodeljs-frontend";

export class DistanceDisplayDecoration implements CanvasDecoration {
  public text = "";
  public x = 0;
  public y = 0;

  public drawDecoration(ctx: CanvasRenderingContext2D) {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "14px sans-serif";
    ctx.fillStyle = "white";
    ctx.fillText(this.text, this.x, this.y);
  }
}
