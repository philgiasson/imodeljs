/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { BeButtonEvent, EventHandled, PrimitiveTool } from '@bentley/imodeljs-frontend';


export class DriveTool extends PrimitiveTool {

  public static toolId = 'DriveTool';
  public static iconSpec = 'icon-placeholder';

  public async onDataButtonDown(ev: BeButtonEvent): Promise<EventHandled> {
    console.log(ev);
    return EventHandled.Yes;
  }

  onRestartTool(): void {
    const tool = new DriveTool();
    if (!tool.run())
      this.exitTool();
  }
}
