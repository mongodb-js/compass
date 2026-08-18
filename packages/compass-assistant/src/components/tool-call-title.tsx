import React from 'react';
import { InlineDefinition } from '@mongodb-js/compass-components';

/**
 * Renders the tool call title, decorating the tool name with an
 * InlineDefinition tooltip when a description is available.
 */
export const ToolCallTitle: React.FunctionComponent<{
  title: string;
  toolDisplayName: string;
  toolDescription?: string;
}> = ({ title, toolDisplayName, toolDescription }) => {
  if (!toolDescription || !title.includes(toolDisplayName)) {
    return <>{title}</>;
  }

  const [before, after] = title.split(toolDisplayName);
  return (
    <>
      {before}
      <InlineDefinition definition={toolDescription}>
        {toolDisplayName}
      </InlineDefinition>
      {after}
    </>
  );
};
