import React, { useCallback } from 'react';
import { ServerIcon } from '@mongodb-js/compass-components';
import type { ToolUIPart } from 'ai';
import type { ToolState } from '../utils';
import { getToolState } from '../utils';
import type { BasicConnectionInfo } from '../compass-assistant-provider';
import {
  useAtlasLoginActions,
  useAtlasSignedInUser,
} from '@mongodb-js/compass-atlas-login-ui';
import { ActionCardMessage } from './action-card-message';
import { doesToolUseConnection } from '@mongodb-js/compass-generative-ai/provider';
import { getToolDisplayName } from '../utils';

const ATLAS_CONNECTION_ERROR_DEBUGGER_TOOL_TYPE =
  'tool-atlas-connection-error-debugger';

interface AtlasToolCallMessageProps {
  toolCall: ToolUIPart;
  connectionInfo: BasicConnectionInfo | null;
  onApprove: (approvalId: string, approved: boolean) => void;
  onDeny: (approvalId: string) => void;
}

function isDebuggerToolCall(type: string): boolean {
  return type === ATLAS_CONNECTION_ERROR_DEBUGGER_TOOL_TYPE;
}

function getTitle(state: ToolState, isUserSignedIn: boolean): string {
  switch (state) {
    case 'success':
    case 'running':
      return 'Connected to Atlas';
    case 'canceled':
      return 'Not connected to Atlas';
    case 'error':
      return 'Failed to debug connection with Atlas';
    default:
      return isUserSignedIn
        ? 'Run Atlas to debug this connection'
        : 'Connect with Atlas to debug this connection';
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
        .then((signedIn: boolean) => onApprove(approvalId, signedIn))
        .catch(() => onApprove(approvalId, false));
    },
    [signIn, onApprove]
  );

  const expandableContentText = `
Connecting would call Atlas API endpoints (cluster state, IP allowlist,
TLS) to explain why this connection is failing. This is read-only and
won’t change your cluster.`;

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
