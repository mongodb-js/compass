import React, { useCallback, useMemo } from 'react';
import {
  css,
  InlineDefinition,
  ServerIcon,
} from '@mongodb-js/compass-components';
import type { ToolUIPart } from 'ai';
import {
  cleanToolCallOutput,
  getExpandableContentText,
  getToolDisplayName,
  getToolState,
  isDebuggerToolCall,
  toolHasOutput,
} from '../utils';
import type { BasicConnectionInfo } from '../compass-assistant-provider';
import { ActionCardMessage } from './action-card-message';
import {
  getAvailableTools,
  doesToolUseConnection,
} from '@mongodb-js/compass-generative-ai/provider';
import type { AtlasSignInEntrypoint } from '@mongodb-js/compass-telemetry';
import {
  useAtlasLoginActions,
  useAtlasSignInStatus,
} from '@mongodb-js/atlas-service/provider';
import { CustomToolResult } from './custom-tool-result';
import { getToolCallTitle } from './tool-call-title';

/**
 * Every sign in this card drives is attributed to the assistant tool call that
 * required it, so we can tell which Atlas tools drive sign in.
 */
function getSignInEntrypoint(
  toolType: ToolUIPart['type']
): AtlasSignInEntrypoint {
  return `assistant-${toolType}`;
}

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

// TODO(COMPASS-11044): update texts to be generic
function getApprovalMessage(
  isSignInInProgress: boolean,
  isUserSignedIn: boolean
) {
  if (isUserSignedIn) {
    return 'Run Atlas to debug this connection?';
  }
  if (isSignInInProgress) {
    return 'Connecting with Atlas to debug this connection';
  }

  return 'Connect with Atlas to debug this connection?';
}

export const AtlasToolCallMessage: React.FunctionComponent<
  AtlasToolCallMessageProps
> = ({ toolCall, connectionInfo, onApprove, onDeny }) => {
  const toolCallState = getToolState(toolCall.state);
  const toolDisplayName = getToolDisplayName(toolCall.type);
  const isAwaitingApproval = toolCallState === 'idle' && !!toolCall.approval;
  const approvalId = toolCall.approval?.id;
  const atlasSignInStatus = useAtlasSignInStatus();
  const isUserSignedIn = !!atlasSignInStatus.user;
  const isSignInInProgress = atlasSignInStatus?.state === 'in-progress';
  const { signIn } = useAtlasLoginActions();

  const chips = useMemo(() => {
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
      signIn({ entrypoint: getSignInEntrypoint(toolCall.type) })
        .then((result) => {
          switch (result.status) {
            case 'success':
              onApprove(approvalId, true);
              break;
            // If sign in timed out, give the user a new chance instead of
            // rejecting the tool
            case 'timed-out':
              break;
            default:
              onApprove(approvalId, false);
              break;
          }
        })
        .catch(() => onApprove(approvalId, false));
    },
    [signIn, onApprove, toolCall.type]
  );

  const toolDescription = getToolDescription(toolCall.type, toolDisplayName);

  const cleanedOutput = useMemo(
    () => (toolCall.output ? cleanToolCallOutput(toolCall.output) : null),
    [toolCall.output]
  );
  const hasOutput = toolHasOutput(toolCall, cleanedOutput);

  const expandableContentText = getExpandableContentText(
    toolCall,
    hasOutput,
    cleanedOutput,
    toolDescription
  );

  const toolNameElement = toolDescription ? (
    <InlineDefinition definition={toolDescription}>
      {toolDisplayName}
    </InlineDefinition>
  ) : (
    toolDisplayName
  );

  const approvalMessage = getApprovalMessage(
    isSignInInProgress,
    isUserSignedIn
  );
  // TODO COMPASS-10973: don't render actions if there's no approvalId.
  return (
    <>
      <ActionCardMessage
        state={isSignInInProgress ? 'running' : toolCallState}
        title={getToolCallTitle(toolCall, toolNameElement, approvalMessage)}
        chips={chips}
        showActions={isAwaitingApproval && !isSignInInProgress}
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
      {hasOutput && (
        <CustomToolResult
          title="Atlas Check Result:"
          toolType={toolCall.type}
          output={cleanedOutput}
        />
      )}
    </>
  );
};
