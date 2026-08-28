import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { css, InlineDefinition, spacing } from '@mongodb-js/compass-components';
import type { ToolUIPart } from 'ai';
import {
  cleanToolCallOutput,
  getExpandableContentText,
  getToolDisplayName,
  getToolDescription,
  getToolState,
  toolHasOutput,
} from '../utils';
import { ActionCardMessage } from './action-card-message';
import { isReadOnlyTool } from '@mongodb-js/compass-generative-ai/provider';
import type { AtlasSignInEntrypoint } from '@mongodb-js/compass-telemetry';
import {
  useAtlasLoginActions,
  useAtlasSignInStatus,
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

function getApprovalMessage(
  toolNameElement: React.ReactNode,
  isUserSignedIn: boolean,
  isSignInInProgress: boolean
): React.ReactNode | undefined {
  if (isUserSignedIn) {
    return undefined;
  }
  if (isSignInInProgress) {
    return <>Connecting with Atlas to run {toolNameElement}...</>;
  }
  return <>Connect with Atlas and run {toolNameElement}?</>;
}

const readonlyNoteStyles = css({
  paddingTop: spacing[200],
});

const ReadonlyNote: React.FunctionComponent = () => (
  <div className={readonlyNoteStyles}>
    {"This is read-only and won't change your cluster."}
  </div>
);

export const AtlasToolCallMessage: React.FunctionComponent<
  AtlasToolCallMessageProps
> = ({ toolCall, onApprove, onDeny }) => {
  const toolCallState = getToolState(toolCall.state);
  const toolDisplayName = getToolDisplayName(toolCall.type);
  const isAwaitingApproval = toolCallState === 'idle' && !!toolCall.approval;
  const approvalId = toolCall.approval?.id;
  const atlasSignInStatus = useAtlasSignInStatus();
  const isUserSignedIn = !!atlasSignInStatus.user;
  const isSignInInProgress = atlasSignInStatus.state === 'in-progress';
  const { signIn } = useAtlasLoginActions();
  const track = useTelemetry();

  const isSignInStateResolved =
    atlasSignInStatus.state !== 'initial' &&
    atlasSignInStatus.state !== 'restoring' &&
    atlasSignInStatus.state !== 'in-progress';

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

  const toolDescription = getToolDescription(toolDisplayName);

  const cleanedOutput = useMemo(
    () => (toolCall.output ? cleanToolCallOutput(toolCall.output) : null),
    [toolCall.output]
  );
  const hasOutput = toolHasOutput(toolCall, cleanedOutput);

  const expandableContentText = getExpandableContentText(
    toolCall,
    hasOutput,
    cleanedOutput
  );

  const toolNameElement = toolDescription ? (
    <InlineDefinition definition={toolDescription}>
      {toolDisplayName}
    </InlineDefinition>
  ) : (
    toolDisplayName
  );

  const approvalMessage = getApprovalMessage(
    toolNameElement,
    isUserSignedIn,
    isSignInInProgress
  );

  const actionCardDescription = useMemo(
    () =>
      isReadOnlyTool(toolDisplayName) && !isUserSignedIn ? (
        <ReadonlyNote />
      ) : undefined,
    [toolDisplayName, isUserSignedIn]
  );

  // TODO COMPASS-10973: don't render actions if there's no approvalId.
  return (
    <>
      <ActionCardMessage
        state={isSignInInProgress ? 'running' : toolCallState}
        title={getToolCallTitle(toolCall, toolNameElement, approvalMessage)}
        // TODO(COMPASS-11077): find a way to properly implement connection info
        // when a connection attempt has failed. The current connectionInfo in assistant-chat
        // represents a connection the user has successfully connected to before.
        chips={[]}
        description={actionCardDescription}
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
