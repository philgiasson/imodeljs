/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import {
  ConfigurableCreateInfo,
  ConfigurableUiManager,
  ToolSettingsEntry,
  ToolSettingsGrid,
  ToolUiProvider
} from '@bentley/ui-framework';
import * as React from 'react';
import { IModelApp } from '@bentley/imodeljs-frontend';
import { DriveTool } from '../../tools/DriveTool';


function LaunchButton() {
  const handleButtonClicked = React.useCallback(() => {
    if (IModelApp.toolAdmin.activeTool)
      (IModelApp.toolAdmin.activeTool as DriveTool).launch();
  }, [])
  return (
    <button onClick={handleButtonClicked}>Launch</button>
  )
}


class DriveToolUiProvider extends ToolUiProvider {
  constructor(info: ConfigurableCreateInfo, options: any) {
    super(info, options);
    this.toolSettingsNode = <ToolSettingsGrid settings={this.getHorizontalToolSettings()} />;
  }

  private getHorizontalToolSettings(): ToolSettingsEntry[] | undefined {
    return [
      { labelNode: "", editorNode: <LaunchButton /> }
    ];
  }
}

ConfigurableUiManager.registerControl("DriveTool", DriveToolUiProvider);
