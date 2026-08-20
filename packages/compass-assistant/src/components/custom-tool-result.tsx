import {
  type ConfigurationParameters,
  css,
  LgChatSuggestions,
  useDarkMode,
} from '@mongodb-js/compass-components';
import { mapAtlasConnectionDebugResult } from '../tool-result-mapper';
import { isDebuggerToolCall } from '../utils';
import React from 'react';
import type { AtlasConnectionDebugResult } from '@mongodb-js/compass-generative-ai/provider';

const { SuggestedActions } = LgChatSuggestions;

const suggestedActionsContainerStyles = css({
  marginTop: '8px',
});

function hasCustomToolResult(toolType: string): boolean {
  return isDebuggerToolCall(toolType);
}

function getToolResultParameters(
  toolType: string,
  output: unknown
): ConfigurationParameters {
  if (isDebuggerToolCall(toolType)) {
    return mapAtlasConnectionDebugResult(output as AtlasConnectionDebugResult);
  }
  return [];
}

export const CustomToolResult: React.FC<{
  toolType: string;
  output: unknown;
}> = ({ toolType, output }) => {
  const darkMode = useDarkMode();
  const configurationParameters = React.useMemo(
    () => getToolResultParameters(toolType, output) ?? [],
    [toolType, output]
  );

  if (!hasCustomToolResult(toolType)) {
    return null;
  }

  return (
    <SuggestedActions
      className={suggestedActionsContainerStyles}
      darkMode={darkMode}
      state="unset"
      // The apply button is not rendered when the state is 'unset', so we can pass a no-op function here.
      onClickApply={() => {}}
      configurationParameters={configurationParameters}
    />
  );
};
