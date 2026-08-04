import React from 'react';
import _ from 'lodash';
import {
  css,
  InlineDefinition,
  ServerIcon,
} from '@mongodb-js/compass-components';
import type { ToolUIPart } from 'ai';
import type { BasicConnectionInfo } from '../compass-assistant-provider';
import {
  getAvailableTools,
  doesToolUseConnection,
} from '@mongodb-js/compass-generative-ai/provider';
import { cleanToolCallOutput, getToolState } from '../utils';
import { ActionCardMessage } from './action-card-message';

interface ToolCallMessageProps {
  connection: BasicConnectionInfo | null;
  toolCall: ToolUIPart;
  onApprove?: (approvalId: string) => void;
  onDeny?: (approvalId: string) => void;
}

// Extract tool name from type (e.g., "tool-list-databases" -> "list-databases")
function getToolDisplayName(type: string): string {
  return type.replace(/^tool-/, '');
}

function getToolDescription(toolName: string): string | undefined {
  // If we get to this point we can assume the tool is available, no need to pipe preferences here
  return getAvailableTools({ enableAtlasConnectionErrorDebugger: true }).find(
    (tool) => tool.name === toolName
  )?.description;
}

const expandableContentStyles = css({
  h3: {
    lineHeight: '16px',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
  },
});

export const ToolCallMessage: React.FunctionComponent<ToolCallMessageProps> = ({
  connection,
  toolCall,
  onApprove,
  onDeny,
}) => {
  const chips = [];

  if (connection && doesToolUseConnection(getToolDisplayName(toolCall.type))) {
    chips.push({ glyph: <ServerIcon />, label: connection.name });
  }

  const toolName = getToolDisplayName(toolCall.type);
  const toolDescription = getToolDescription(toolName);
  const toolCallState = getToolState(toolCall.state);

  const inputJSON = JSON.stringify(toolCall.input || {}, null, 2);

  const cleanedOutput = React.useMemo(
    () => (toolCall.output ? cleanToolCallOutput(toolCall.output) : null),
    [toolCall.output]
  );

  const hasOutput = !!(
    cleanedOutput &&
    (toolCall.state === 'output-available' || toolCall.state === 'output-error')
  );

  const outputText = cleanedOutput
    ? JSON.stringify(cleanedOutput, null, 2)
    : '';

  const isAwaitingApproval =
    toolCall.state === 'approval-requested' && !!toolCall.approval;
  const wasApproved = toolCall.approval?.approved === true;
  const isDenied = toolCall.state === 'output-denied';
  const didRun =
    toolCall.state === 'output-available' || toolCall.state === 'output-error';

  const expandableContent = [
    `### Arguments

\`\`\`json
${inputJSON}
\`\`\``,
  ];

  if (hasOutput) {
    expandableContent.push(`### Response

\`\`\`json
${outputText}
\`\`\``);
  }

  if (toolCall.errorText) {
    expandableContent.push(`### Error

\`\`\`
${toolCall.errorText}
\`\`\``);
  }

  const expandableContentText = expandableContent.join('\n\n');

  const toolNameElement = toolDescription ? (
    <InlineDefinition definition={toolDescription}>{toolName}</InlineDefinition>
  ) : (
    toolName
  );

  let title: React.ReactNode;
  if (didRun) {
    title = <>Ran {toolNameElement}</>;
  } else if (wasApproved) {
    title = <>Running {toolNameElement}</>;
  } else if (isDenied) {
    title = <>Cancelled {toolNameElement}</>;
  } else {
    title = <>Run {toolNameElement}?</>;
  }

  if (toolCall.state === 'input-streaming') {
    // The tool call renders with undefined input or incomplete input and then
    // soon after with an object. At that point even if there are no parameters
    // for the tool call (think list-databases), the input will be {}. In order
    // to have the tool card's initialIsExpanded work correctly, we therefore
    // wait until the input is fully available which in our case is pretty much
    // instantly because none of our tools take a large amount of input yet.
    return null;
  }

  const initialIsExpanded = !_.isEmpty(toolCall.input);

  return (
    <ActionCardMessage
      initialIsExpanded={initialIsExpanded}
      state={toolCallState}
      title={title}
      chips={chips}
      contentClassName={expandableContentStyles}
      showActions={isAwaitingApproval}
      focusPrimaryKey={toolCall.approval?.id}
      buttons={[
        {
          label: 'Cancel',
          variant: 'default',
          onClick: () => toolCall.approval && onDeny?.(toolCall.approval.id),
        },
        {
          label: 'Run',
          variant: 'primary',
          onClick: () => toolCall.approval && onApprove?.(toolCall.approval.id),
          isPrimary: true,
        },
      ]}
    >
      {expandableContentText}
    </ActionCardMessage>
  );
};
