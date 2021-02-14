/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { ConfigurableCreateInfo, ConfigurableUiManager, ToolUiProvider } from '@bentley/ui-framework';
import * as React from 'react';

class DriveToolUiProvider extends ToolUiProvider {
  constructor(info: ConfigurableCreateInfo, options: any) {
    console.warn('Drive tool provider constructor');
    super(info, options);
  }
}

ConfigurableUiManager.registerControl("DriveTool", DriveToolUiProvider);
