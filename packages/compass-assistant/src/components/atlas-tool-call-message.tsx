import React, { useCallback } from 'react';
import {
  css,
  InlineDefinition,
  ServerIcon,
} from '@mongodb-js/compass-components';
import type { ToolUIPart } from 'ai';
import {
  cleanToolCallOutput,
  getToolState,
  hasCustomToolResult,
  isDebuggerToolCall,
} from '../utils';
import type { BasicConnectionInfo } from '../compass-assistant-provider';
import { ActionCardMessage } from './action-card-message';
import {
  getAvailableTools,
  doesToolUseConnection,
} from '@mongodb-js/compass-generative-ai/provider';
import { getToolDisplayName } from '../utils';
import {
  useAtlasLoginActions,
  useAtlasSignedInUser,
} from '@mongodb-js/atlas-service/provider';
import { CustomToolResult } from './custom-tool-result';

interface AtlasToolCallMessageProps {
  toolCall: ToolUIPart;
  connectionInfo: BasicConnectionInfo | null;
  onApprove: (approvalId: string, approved: boolean) => void;
  onDeny: (approvalId: string) => void;
}

const expandableContentStyles = css({
  h3: {
    lineHeight: '16px',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
  },
});

function getTitle(
  toolCall: ToolUIPart,
  isUserSignedIn: boolean,
  toolDescription?: string
): React.ReactNode {
  const toolName = getToolDisplayName(toolCall.type);
  const toolNameElement = toolDescription ? (
    <InlineDefinition definition={toolDescription}>{toolName}</InlineDefinition>
  ) : (
    toolName
  );

  let title: React.ReactNode;
  const wasApproved = toolCall.approval?.approved === true;
  const isDenied = toolCall.state === 'output-denied';
  const didRun =
    toolCall.state === 'output-available' || toolCall.state === 'output-error';
  if (didRun) {
    title = <>Ran {toolNameElement}</>;
  } else if (wasApproved) {
    title = <>Running {toolNameElement}</>;
  } else if (isDenied) {
    title = <>Cancelled {toolNameElement}</>;
  } else {
    title = (
      <>
        {isUserSignedIn ? (
          <>Run Atlas to debug this connection?</>
        ) : (
          <>Connect with Atlas to debug this connection?</>
        )}
      </>
    );
  }
  return title;
}

function getToolDescription(toolType: string): string {
  if (isDebuggerToolCall(toolType)) {
    return `Connecting would call Atlas API endpoint (cluster
state, IP allowlist, TLS) to explain why this connection is failing.
This is read-only and won't change your cluster.`;
  }

  return (
    getAvailableTools({ enableAtlasConnectionErrorDebugger: true }).find(
      (tool) => tool.name === getToolDisplayName(toolType)
    )?.description || ''
  );
}

function getExpandableContentText(
  toolCall: ToolUIPart,
  toolDescription: string,
  cleanedOutput: any
): string {
  const toolCallState = getToolState(toolCall.state);
  const hasOutput = !!(
    cleanedOutput &&
    (toolCall.state === 'output-available' || toolCall.state === 'output-error')
  );

  const inputJSON = JSON.stringify(toolCall.input || {}, null, 2);
  const argumentsText = `### Arguments

\`\`\`json
${inputJSON}
\`\`\``;

  const outputText = cleanedOutput
    ? JSON.stringify(cleanedOutput, null, 2)
    : '';

  if (toolCallState === 'idle') {
    return [toolDescription, argumentsText].join('\n\n');
  } else {
    const expandableContent = [argumentsText];

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

    return expandableContent.join('\n\n');
  }
}

export const AtlasToolCallMessage: React.FunctionComponent<
  AtlasToolCallMessageProps
> = ({ toolCall, connectionInfo, onApprove, onDeny }) => {
  const toolCallState = getToolState(toolCall.state);
  const isAwaitingApproval = toolCallState === 'idle' && !!toolCall.approval;
  const approvalId = toolCall.approval?.id;
  const isUserSignedIn = !!useAtlasSignedInUser();
  const { signIn } = useAtlasLoginActions();

  const chips = [];

  if (
    connectionInfo &&
    (doesToolUseConnection(getToolDisplayName(toolCall.type)) ||
      isDebuggerToolCall(toolCall.type))
  ) {
    chips.push({ glyph: <ServerIcon />, label: connectionInfo.name });
  }

  const handleAtlasToolApproval = useCallback(
    (approvalId: string) => {
      signIn()
        .then((userInfo) => onApprove(approvalId, !!userInfo))
        .catch(() => onApprove(approvalId, false));
    },
    [signIn, onApprove]
  );

  const toolDescription = getToolDescription(toolCall.type);

  const cleanedOutput = React.useMemo(
    () => (toolCall.output ? cleanToolCallOutput(toolCall.output) : null),
    [toolCall.output]
  );
  const hasOutput = !!(
    cleanedOutput &&
    (toolCall.state === 'output-available' || toolCall.state === 'output-error')
  );

  const expandableContentText = getExpandableContentText(
    toolCall,
    toolDescription,
    cleanedOutput
  );

  // TODO COMPASS-10973: don't render actions if there's no approvalId.
  return (
    <div>
      <ActionCardMessage
        state={toolCallState}
        title={getTitle(toolCall, isUserSignedIn, toolDescription)}
        chips={chips}
        showActions={isAwaitingApproval}
        initialIsExpanded={!hasOutput}
        contentClassName={expandableContentStyles}
        focusPrimaryKey={approvalId}
        key={hasOutput ? 'collapsed' : 'expanded'}
        buttons={[
          {
            label: isUserSignedIn ? 'Cancel' : 'Skip',
            variant: 'default',
            onClick: () => approvalId && onDeny(approvalId),
          },
          {
            label: isUserSignedIn ? 'Run' : 'Connect to Atlas',
            variant: 'primary',
            onClick: () => approvalId && handleAtlasToolApproval(approvalId),
            isPrimary: true,
          },
        ]}
      >
        {expandableContentText}
      </ActionCardMessage>
      {hasOutput && hasCustomToolResult(toolCall.type) && (
        <CustomToolResult toolType={toolCall.type} output={cleanedOutput} />
      )}
    </div>
  );
};
