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

function getToolResultParameters(
  toolType: string,
  output: unknown
): ConfigurationParameters {
  // This is so the first row renders as a title
  const titleRow = { key: 'Atlas check result:', value: '' };
  if (isDebuggerToolCall(toolType)) {
    return [
      titleRow,
      ...mapAtlasConnectionDebugResult(output as AtlasConnectionDebugResult),
    ];
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
