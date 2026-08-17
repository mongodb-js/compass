import React, { useCallback, useEffect, useRef } from 'react';
import { ServerIcon } from '@mongodb-js/compass-components';
import type { ToolUIPart } from 'ai';
import type { ToolState } from '../utils';
import { cleanToolCallOutput, getToolState } from '../utils';
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
  useIsAtlasSignInStateResolved,
} from '@mongodb-js/atlas-service/provider';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';

const ATLAS_CONNECTION_ERROR_DEBUGGER_TOOL_TYPE =
  'tool-atlas-connection-error-debugger';

/**
 * This card is only ever rendered as part of the assistant's connection failure
 * troubleshooting flow, so every sign in it drives is attributed to it.
 */
const SIGN_IN_ENTRYPOINT = 'connection_failure';

interface AtlasToolCallMessageProps {
  toolCall: ToolUIPart;
  connectionInfo: BasicConnectionInfo | null;
  onApprove: (approvalId: string, approved: boolean) => void;
  onDeny: (approvalId: string) => void;
}

function isDebuggerToolCall(type: string): boolean {
  return type === ATLAS_CONNECTION_ERROR_DEBUGGER_TOOL_TYPE;
}

// TODO COMPASS-10944: The title logic should match what's in tool-call-message.tsx.
function getTitle(state: ToolState, isUserSignedIn: boolean): string {
  switch (state) {
    case 'success':
    case 'running':
      return 'Running';
    case 'canceled':
      return 'Canceled';
    case 'error':
      return 'Failed';
    default:
      return isUserSignedIn
        ? 'Run Atlas to debug this connection'
        : 'Connect with Atlas to debug this connection';
  }
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

export const AtlasToolCallMessage: React.FunctionComponent<
  AtlasToolCallMessageProps
> = ({ toolCall, connectionInfo, onApprove, onDeny }) => {
  const toolCallState = getToolState(toolCall.state);
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
    track('Atlas Sign In Prompt Shown', { entrypoint: SIGN_IN_ENTRYPOINT });
  }, [isSignInPromptShown, approvalId, track]);

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
      signIn({ entrypoint: SIGN_IN_ENTRYPOINT })
        .then((userInfo) => onApprove(approvalId, !!userInfo))
        .catch(() => onApprove(approvalId, false));
    },
    [signIn, onApprove]
  );

  const inputJSON = JSON.stringify(toolCall.input || {}, null, 2);
  const argumentsText = `### Arguments

\`\`\`json
${inputJSON}
\`\`\``;

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

  let expandableContentText = '';
  if (toolCallState === 'idle') {
    expandableContentText = [
      getToolDescription(toolCall.type),
      argumentsText,
    ].join('\n\n');
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

    expandableContentText = expandableContent.join('\n\n');
  }

  // TODO COMPASS-10973: don't render actions if there's no approvalId.
  return (
    <ActionCardMessage
      state={toolCallState}
      title={getTitle(toolCallState, isUserSignedIn)}
      chips={chips}
      showActions={isAwaitingApproval}
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
  );
};
