import React from 'react';
import _ from 'lodash';
import {
  css,
  LgChatMessage,
  spacing,
  useDarkMode,
  InlineDefinition,
  ServerIcon,
  palette,
  cx,
} from '@mongodb-js/compass-components';
import type { ToolUIPart } from 'ai';
import type { BasicConnectionInfo } from '../compass-assistant-provider';
import { AVAILABLE_TOOLS } from '@mongodb-js/compass-generative-ai';
import { getToolState } from '../utils';

const { Message } = LgChatMessage;

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
  return AVAILABLE_TOOLS.find((tool) => tool.name === toolName)?.description;
}

const toolCallMessageStyles = css({
  paddingTop: spacing[400],

  // TODO(COMPASS-10000): This is a temporary fix to make the tool call message take the entire width of the chat message.
  '> div': {
    width: '100%',
  },
});

const expandableContentStyles = css({
  h3: {
    lineHeight: '16px',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
  },

  pre: {
    maxHeight: '200px',
    overflow: 'auto',
  },
});
const expandableContentStylesLight = css({
  h3: {
    color: palette.gray.dark1,
  },
});

const expandableContentStylesDark = css({
  h3: {
    color: palette.gray.light1,
  },
});

export const ToolCallMessage: React.FunctionComponent<ToolCallMessageProps> = ({
  connection,
  toolCall,
  onApprove,
  onDeny,
}) => {
  const darkMode = useDarkMode();

  const chips = [];

  // TODO: find a better way to only display this when the connection is relevant
  if (connection && !toolCall.type.startsWith('tool-get-current-')) {
    chips.push({ glyph: <ServerIcon />, label: connection.name });
  }

  const toolName = getToolDisplayName(toolCall.type);
  const toolDescription = getToolDescription(toolName);
  const toolCallState = getToolState(toolCall.state);

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
    <div className={toolCallMessageStyles}>
      <Message.ActionCard
        initialIsExpanded={initialIsExpanded}
        showExpandButton={true}
        state={toolCallState}
        title={title}
        darkMode={darkMode}
        chips={chips}
      >
        <Message.ActionCard.ExpandableContent
          className={cx(
            expandableContentStyles,
            darkMode
              ? expandableContentStylesDark
              : expandableContentStylesLight
          )}
        >
          {expandableContentText}
        </Message.ActionCard.ExpandableContent>
        {isAwaitingApproval && toolCall.approval && (
          <>
            <Message.ActionCard.Button
              onClick={() => onDeny?.(toolCall.approval.id)}
              variant="default"
            >
              Cancel
            </Message.ActionCard.Button>
            <Message.ActionCard.Button
              onClick={() => onApprove?.(toolCall.approval.id)}
              variant="primary"
            >
              Run
            </Message.ActionCard.Button>
          </>
        )}
      </Message.ActionCard>
    </div>
  );
};
