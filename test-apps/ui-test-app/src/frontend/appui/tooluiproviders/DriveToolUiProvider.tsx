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
import { Button, Slider } from '@bentley/ui-core';
import * as React from 'react';
import { IModelApp } from '@bentley/imodeljs-frontend';
import { DriveTool } from '../../tools/DriveTool';

function ZAxisOffset() {
  const [offset, setOffset] = React.useState((IModelApp.toolAdmin.activeTool) ? (IModelApp.toolAdmin.activeTool as DriveTool).zAxisOffset : 0);
  const handleSliderChange = React.useCallback((values: ReadonlyArray<number>) => {
    let value = values[0];
    if (IModelApp.toolAdmin.activeTool)
      (IModelApp.toolAdmin.activeTool as DriveTool).zAxisOffset = value;
    setOffset(value);
  }, []);
  return (
    <Slider style={{minWidth: '160px'}}
            min={0} max={5} values={[offset]} step={0.1} showMinMax={true}
            showTooltip tooltipBelow onChange={handleSliderChange}/>
  );
}

function LaunchButton() {
  const handleButtonClicked = React.useCallback(() => {
    if (IModelApp.toolAdmin.activeTool)
      (IModelApp.toolAdmin.activeTool as DriveTool).launch();
  }, [])
  return (
    <Button onClick={handleButtonClicked}>Launch</Button>
  )
}

class DriveToolUiProvider extends ToolUiProvider {
  constructor(info: ConfigurableCreateInfo, options: any) {
    super(info, options);
    this.toolSettingsNode = <ToolSettingsGrid settings={this.getHorizontalToolSettings()}/>;
  }

  private getHorizontalToolSettings(): ToolSettingsEntry[] | undefined {
    return [
      {labelNode: 'Slider', editorNode: <ZAxisOffset/>},
      {labelNode: '', editorNode: <LaunchButton/>}
    ];
  }
}

ConfigurableUiManager.registerControl('DriveTool', DriveToolUiProvider);
