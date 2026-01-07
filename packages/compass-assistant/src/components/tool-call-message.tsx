import React from 'react';
import {
  css,
  LgChatMessage,
  spacing,
  useDarkMode,
  InlineDefinition,
} from '@mongodb-js/compass-components';
import { AVAILABLE_TOOLS } from './tool-toggle';

const { Message } = LgChatMessage;

export const ToolCardState = {
  Idle: 'idle',
  Running: 'running',
  Success: 'success',
  Error: 'error',
  Canceled: 'canceled',
} as const;

type ToolCardStateValue = (typeof ToolCardState)[keyof typeof ToolCardState];

export interface ToolCallPart {
  type: string;
  toolCallId?: string;
  state?:
    | 'approval-requested'
    | 'approval-responded'
    | 'input-available'
    | 'output-available'
    | 'output-error'
    | 'output-denied';
  input?: Record<string, unknown>;
  output?: {
    content?: Array<{
      type: string;
      text?: string;
    }>;
  };
  approval?: {
    id: string;
    approved?: boolean;
    reason?: string;
  };
}

interface ToolCallMessageProps {
  toolCall: ToolCallPart;
  onApprove?: (approvalId: string) => void;
  onDeny?: (approvalId: string) => void;
}

// Extract tool name from type (e.g., "tool-list-databases" -> "list-databases")
function getToolDisplayName(type: string): string {
  return type.replace(/^tool-/, '');
}

function getToolDescription(toolName: string): string | undefined {
  return AVAILABLE_TOOLS.find((tool) => tool.name === toolName)?.description;
}

// Map our tool call states to LeafyGreen ToolCardState
function mapToolCallStateToCardState(
  toolCallState?: ToolCallPart['state']
): ToolCardStateValue {
  switch (toolCallState) {
    case 'approval-requested':
      return ToolCardState.Idle;
    case 'approval-responded':
      return ToolCardState.Running;
    case 'input-available':
      return ToolCardState.Running;
    case 'output-available':
      return ToolCardState.Success;
    case 'output-error':
      return ToolCardState.Error;
    case 'output-denied':
      return ToolCardState.Canceled;
    default:
      return ToolCardState.Idle;
  }
}

const toolCallMessageStyles = css({
  paddingTop: spacing[400],

  // TODO(COMPASS-10000): This is a temporary fix to make the tool call message take the entire width of the chat message.
  '> div': {
    width: '100%',
  },
});

export const ToolCallMessage: React.FunctionComponent<ToolCallMessageProps> = ({
  toolCall,
  onApprove,
  onDeny,
}) => {
  const darkMode = useDarkMode();

  const toolName = getToolDisplayName(toolCall.type);
  const toolDescription = getToolDescription(toolName);
  const toolCallState = mapToolCallStateToCardState(toolCall.state);

  const inputJSON = JSON.stringify(toolCall.input || {}, null, 2);

  const hasOutput = !!(
    toolCall.output &&
    (toolCall.state === 'output-available' || toolCall.state === 'output-error')
  );

  const outputText = toolCall.output
    ? JSON.stringify(toolCall.output, null, 2)
    : '';

  const isAwaitingApproval = toolCall.state === 'approval-requested';
  const wasApproved = toolCall.approval?.approved === true;
  const isDenied = toolCall.state === 'output-denied';

  const expandableContent = `## Input
\`\`\`json
${inputJSON}
\`\`\`${
    hasOutput
      ? `

## Output
\`\`\`json
${outputText}
\`\`\``
      : ''
  }`;

  const toolNameElement = toolDescription ? (
    <InlineDefinition definition={toolDescription}>{toolName}</InlineDefinition>
  ) : (
    toolName
  );

  let title: React.ReactNode;
  if (hasOutput) {
    title = <>Ran {toolNameElement}</>;
  } else if (wasApproved) {
    title = <>Running {toolNameElement}</>;
  } else if (isDenied) {
    title = <>Cancelled {toolNameElement}</>;
  } else {
    title = <>Run {toolNameElement}?</>;
  }

  return (
    <div className={toolCallMessageStyles}>
      <Message.ToolCard
        showExpandButton={true}
        state={toolCallState}
        title={title}
        darkMode={darkMode}
      >
        <Message.ToolCard.ExpandableContent>
          {expandableContent}
        </Message.ToolCard.ExpandableContent>
        {isAwaitingApproval && toolCall.approval && (
          <Message.ToolCard.Actions
            onClickCancel={() => onDeny?.(toolCall.approval!.id)}
            onClickRun={() => onApprove?.(toolCall.approval!.id)}
          />
        )}
      </Message.ToolCard>
    </div>
  );
};
