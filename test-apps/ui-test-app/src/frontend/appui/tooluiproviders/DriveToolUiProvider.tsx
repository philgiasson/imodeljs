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
  const [offset, setOffset] = React.useState((IModelApp.toolAdmin.activeTool) ? (IModelApp.toolAdmin.activeTool as DriveTool).manager.zAxisOffset : 0);
  const handleSliderChange = React.useCallback((values: ReadonlyArray<number>) => {
    let value = values[0];
    if (IModelApp.toolAdmin.activeTool)
      (IModelApp.toolAdmin.activeTool as DriveTool).manager.zAxisOffset = value;
    setOffset(value);
  }, []);
  return (
    <Slider style={{minWidth: '160px'}}
            min={0} max={5} values={[offset]} step={0.1} showMinMax={true}
            showTooltip tooltipBelow onChange={handleSliderChange}/>
  );
}

function Speed() {
  const [speed, setSpeed] = React.useState((IModelApp.toolAdmin.activeTool) ? (IModelApp.toolAdmin.activeTool as DriveTool).manager.speed : 0);
  const handleSliderChange = React.useCallback((values: ReadonlyArray<number>) => {
    let value = values[0];
    if (IModelApp.toolAdmin.activeTool)
      (IModelApp.toolAdmin.activeTool as DriveTool).manager.speed = value;
    setSpeed(value);
  }, []);
  return (
    <Slider style={{minWidth: '160px'}}
            min={-50} max={50} values={[speed]} step={1} showMinMax={true}
            showTooltip tooltipBelow onChange={handleSliderChange}/>
  );
}

function LaunchButton() {
  const handleButtonClicked = React.useCallback(() => {
    if (IModelApp.toolAdmin.activeTool)
      (IModelApp.toolAdmin.activeTool as DriveTool).manager.launch();
  }, [])
  return (
    <Button onClick={handleButtonClicked}>Launch</Button>
  )
}

function StopButton() {
  const handleButtonClicked = React.useCallback(() => {
    if (IModelApp.toolAdmin.activeTool)
      (IModelApp.toolAdmin.activeTool as DriveTool).manager.stop();
  }, [])
  return (
    <Button onClick={handleButtonClicked}>Stop</Button>
  )
}

class DriveToolUiProvider extends ToolUiProvider {
  constructor(info: ConfigurableCreateInfo, options: any) {
    super(info, options);
    this.toolSettingsNode = <ToolSettingsGrid settings={this.getHorizontalToolSettings()}/>;
  }

  private getHorizontalToolSettings(): ToolSettingsEntry[] | undefined {
    return [
      {labelNode: 'ZAxisOffset', editorNode: <ZAxisOffset/>},
      {labelNode: 'Speed', editorNode: <Speed/>},
      {labelNode: '', editorNode: <LaunchButton/>},
      {labelNode: '', editorNode: <StopButton/>}
    ];
  }
}

ConfigurableUiManager.registerControl('DriveTool', DriveToolUiProvider);
