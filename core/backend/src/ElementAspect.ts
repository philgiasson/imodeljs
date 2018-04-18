/*---------------------------------------------------------------------------------------------
|  $Copyright: (c) 2018 Bentley Systems, Incorporated. All rights reserved. $
 *--------------------------------------------------------------------------------------------*/
import { Id64 } from "@bentley/bentleyjs-core";
import { Entity } from "./Entity";
import { IModelDb } from "./IModelDb";
import { ElementAspectProps } from "@bentley/imodeljs-common";

/** @module BisCore */

/** An Element Aspect is a class that defines a set of properties that are related to (and owned by) a single element.
 * Semantically, an Element Aspect can be considered part of the Element. Thus, an Element Aspect is deleted if its owning Element is deleted.
 * BIS Guideline: Subclass ElementUniqueAspect or ElementMultiAspect rather than subclassing ElementAspect directly.
 */
export class ElementAspect extends Entity implements ElementAspectProps {
  public element: Id64;

  constructor(props: ElementAspectProps, iModel: IModelDb) {
    super(props, iModel);
    this.element = Id64.fromJSON(props.element);
  }
}

/** An Element Unique Aspect is an Element Aspect where there can be only zero or one instance of the Element Aspect class per Element. See [[IModelDb.getUniqueAspect]] */
export class ElementUniqueAspect extends ElementAspect {
}

/** An Element Multi-Aspect is an Element Aspect where there can be <em>n</em> instances of the Element Aspect class per Element. See [[IModelDb.getMultiAspects]] */
export class ElementMultiAspect extends ElementAspect {
}
