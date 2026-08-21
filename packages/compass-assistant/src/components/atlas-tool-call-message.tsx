import React, { useCallback, useEffect, useMemo, useRef } from 'react';
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
  useAtlasSignedInUser,
  useIsAtlasSignInStateResolved,
} from '@mongodb-js/atlas-service/provider';
import { CustomToolResult } from './custom-tool-result';
import { getToolCallTitle } from './tool-call-title';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';

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

export const AtlasToolCallMessage: React.FunctionComponent<
  AtlasToolCallMessageProps
> = ({ toolCall, connectionInfo, onApprove, onDeny }) => {
  const toolCallState = getToolState(toolCall.state);
  const toolDisplayName = getToolDisplayName(toolCall.type);
  const isAwaitingApproval = toolCallState === 'idle' && !!toolCall.approval;
  const approvalId = toolCall.approval?.id;
  const isUserSignedIn = !!useAtlasSignedInUser();
  const { signIn } = useAtlasLoginActions();
  const track = useTelemetry();
  const isSignInStateResolved = useIsAtlasSignInStateResolved();

  // The card re-renders on every state change, so we only report the prompt the
  // first time it's actually offered to a signed out user. We also wait for the
  // sign in state to be restored, otherwise an already signed in user looks
  // signed out on the first render.
  const trackedPromptForApprovalId = useRef<string | null>(null);
  const isSignInPromptShown =
    isAwaitingApproval &&
    isSignInStateResolved &&
    !isUserSignedIn &&
    !!approvalId;

  useEffect(() => {
    if (
      !isSignInPromptShown ||
      trackedPromptForApprovalId.current === approvalId
    ) {
      return;
    }
    trackedPromptForApprovalId.current = approvalId ?? null;
    track('Atlas Sign In Prompt Shown', {
      entrypoint: getSignInEntrypoint(toolCall.type),
    });
  }, [isSignInPromptShown, approvalId, track, toolCall.type]);

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
        .then((userInfo) => onApprove(approvalId, !!userInfo))
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

  // TODO(COMPASS-11044): update texts to be generic
  const approvalMessage = isUserSignedIn
    ? 'Run Atlas to debug this connection?'
    : 'Connect with Atlas to debug this connection?';

  // TODO COMPASS-10973: don't render actions if there's no approvalId.
  return (
    <>
      <ActionCardMessage
        state={toolCallState}
        title={getToolCallTitle(toolCall, toolNameElement, approvalMessage)}
        chips={chips}
        showActions={isAwaitingApproval}
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
