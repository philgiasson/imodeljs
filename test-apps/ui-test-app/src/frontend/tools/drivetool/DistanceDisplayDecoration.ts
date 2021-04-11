/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { CanvasDecoration, DecorateContext, IModelApp, QuantityType } from "@bentley/imodeljs-frontend";
import { Point3d } from "@bentley/geometry-core";
import { FormatterSpec } from "@bentley/imodeljs-quantity";

export class DistanceDisplayDecoration implements CanvasDecoration {

  public mousePosition = Point3d.createZero();
  public distance = 0;

  private _rectWidth = 100;
  private _rectHeight = 30;

  private _xOffset = 60;
  private _yOffset = 60;
  private _formatter: FormatterSpec | undefined;


  constructor() {
    IModelApp.quantityFormatter?.getFormatterSpecByQuantityType(QuantityType.LengthEngineering)
      .then((formatter) => { this._formatter = formatter; });
  }

  public drawDecoration(ctx: CanvasRenderingContext2D) {
    if (this.distance > 0) {
      const x = this.mousePosition.x + this._xOffset;
      const y = this.mousePosition.y - this._yOffset;

      ctx.fillStyle = "#4f5d65";
      ctx.fillRect(x, y, this._rectWidth, this._rectHeight);

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "14px sans-serif";
      ctx.fillStyle = "white";
      let formattedDistance = "placeholder";
      if (this._formatter) {
        formattedDistance = IModelApp.quantityFormatter.formatQuantity(this.distance, this._formatter);
      }
      ctx.fillText(formattedDistance, x + (this._rectWidth / 2), y + (this._rectHeight / 2));
    }
  }
}
