import React from 'react';
import {
  css,
  LgChatMessage,
  spacing,
  useDarkMode,
  Icon,
} from '@mongodb-js/compass-components';
import type { ToolUIPart } from 'ai';
import type { AtlasAuthService } from '@mongodb-js/atlas-service/provider';
import { getToolState } from '../utils';

const { Message } = LgChatMessage;

interface AtlasToolCallMessageProps {
  toolCall: ToolUIPart;
  title: React.ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  atlasAuthService: Pick<AtlasAuthService, 'isAuthenticated' | 'signIn'>;
  onApprove?: (approvalId: string) => void;
  onDeny?: (approvalId: string) => void;
}

const toolCallMessageStyles = css({
  paddingTop: spacing[400],

  '> div': {
    width: '100%',
  },
});

export const AtlasToolCallMessage: React.FunctionComponent<
  AtlasToolCallMessageProps
> = ({
  toolCall,
  title,
  confirmLabel,
  cancelLabel,
  atlasAuthService,
  onApprove,
  onDeny,
}) => {
  const darkMode = useDarkMode();
  const runButtonRef = React.useRef<HTMLButtonElement>(null);
  const [isSigningIn, setIsSigningIn] = React.useState(false);

  const toolCallState = getToolState(toolCall.state);
  const isAwaitingApproval =
    toolCall.state === 'approval-requested' && !!toolCall.approval;

  React.useEffect(() => {
    if (isAwaitingApproval && runButtonRef.current) {
      runButtonRef.current.focus();
    }
  }, [isAwaitingApproval, toolCall.approval?.id]);

  if (toolCall.state === 'input-streaming') {
    return null;
  }

  const handleConfirm = async () => {
    if (!toolCall.approval) {
      return;
    }
    const approvalId = toolCall.approval.id;

    const isLoggedIn = await atlasAuthService.isAuthenticated();
    if (!isLoggedIn) {
      setIsSigningIn(true);
      try {
        console.log('Signing in to Atlas...');
        // await atlasAuthService.signIn();
      } catch {
        setIsSigningIn(false);
        onDeny?.(approvalId);
        return;
      }
      setIsSigningIn(false);
    }
    onApprove?.(approvalId);
  };

  return (
    <div className={toolCallMessageStyles}>
      <Message.ActionCard
        showExpandButton={false}
        state={toolCallState}
        title={title}
        darkMode={darkMode}
      >
        {isAwaitingApproval && (
          <Message.ActionCard.Button
            onClick={() => toolCall.approval && onDeny?.(toolCall.approval.id)}
            variant="default"
            disabled={isSigningIn}
          >
            {cancelLabel}
          </Message.ActionCard.Button>
        )}
        {isAwaitingApproval && (
          <Message.ActionCard.Button
            onClick={() => void handleConfirm()}
            variant="primary"
            rightGlyph={<Icon glyph="Return" />}
            ref={runButtonRef}
            disabled={isSigningIn}
          >
            {confirmLabel}
          </Message.ActionCard.Button>
        )}
      </Message.ActionCard>
    </div>
  );
};
