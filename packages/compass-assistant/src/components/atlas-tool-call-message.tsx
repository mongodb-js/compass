import React, { useCallback } from 'react';
import {
  css,
  InlineDefinition,
  ServerIcon,
} from '@mongodb-js/compass-components';
import type { ToolUIPart } from 'ai';
import {
  cleanToolCallOutput,
  getToolDisplayName,
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

function toolHasOutput(toolCall: ToolUIPart, cleanedOutput: unknown): boolean {
  return (
    !!cleanedOutput &&
    (toolCall.state === 'output-available' || toolCall.state === 'output-error')
  );
}

function getTitle(
  toolCall: ToolUIPart,
  isUserSignedIn: boolean,
  toolDisplayName: string,
  toolDescription?: string
): React.ReactNode {
  const toolNameElement = toolDescription ? (
    <InlineDefinition definition={toolDescription}>
      {toolDisplayName}
    </InlineDefinition>
  ) : (
    toolDisplayName
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

function getToolDescription(toolType: string, toolDisplayName: string): string {
  if (isDebuggerToolCall(toolType)) {
    return `Connecting would call Atlas API endpoint (cluster
state, IP allowlist, TLS) to explain why this connection is failing.
This is read-only and won't change your cluster.`;
  }

  return (
    getAvailableTools({ enableAtlasConnectionErrorDebugger: true }).find(
      (tool) => tool.name === toolDisplayName
    )?.description || ''
  );
}

function getExpandableContentText(
  toolCall: ToolUIPart,
  toolDescription: string,
  cleanedOutput: unknown
): string {
  const toolCallState = getToolState(toolCall.state);
  const hasOutput = toolHasOutput(toolCall, cleanedOutput);

  const inputJSON = JSON.stringify(toolCall.input || {}, null, 2);
  const argumentsText = `### Arguments

\`\`\`json
${inputJSON}
\`\`\``;

  if (toolCallState === 'idle') {
    return [toolDescription, argumentsText].join('\n\n');
  }

  const expandableContent = [argumentsText];

  if (hasOutput) {
    const outputText = cleanedOutput
      ? JSON.stringify(cleanedOutput, null, 2)
      : '';

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

export const AtlasToolCallMessage: React.FunctionComponent<
  AtlasToolCallMessageProps
> = ({ toolCall, connectionInfo, onApprove, onDeny }) => {
  const toolCallState = getToolState(toolCall.state);
  const toolDisplayName = getToolDisplayName(toolCall.type);
  const isAwaitingApproval = toolCallState === 'idle' && !!toolCall.approval;
  const approvalId = toolCall.approval?.id;
  const isUserSignedIn = !!useAtlasSignedInUser();
  const { signIn } = useAtlasLoginActions();

  const chips = React.useMemo(() => {
    if (
      connectionInfo &&
      (doesToolUseConnection(toolDisplayName) ||
        isDebuggerToolCall(toolCall.type))
    ) {
      return [{ glyph: <ServerIcon />, label: connectionInfo.name }];
    }
    return [];
  }, [connectionInfo, toolCall.type, toolDisplayName]);

  const handleAtlasToolApproval = useCallback(
    (approvalId: string) => {
      signIn()
        .then((userInfo) => onApprove(approvalId, !!userInfo))
        .catch(() => onApprove(approvalId, false));
    },
    [signIn, onApprove]
  );

  const toolDescription = getToolDescription(toolCall.type, toolDisplayName);

  const cleanedOutput = React.useMemo(
    () => (toolCall.output ? cleanToolCallOutput(toolCall.output) : null),
    [toolCall.output]
  );
  const hasOutput = toolHasOutput(toolCall, cleanedOutput);

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
        title={getTitle(
          toolCall,
          isUserSignedIn,
          toolDisplayName,
          toolDescription
        )}
        chips={chips}
        showActions={isAwaitingApproval}
        initialIsExpanded={!hasOutput}
        contentClassName={expandableContentStyles}
        focusPrimaryKey={approvalId}
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
