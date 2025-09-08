import React, { useCallback, useContext } from 'react';
import {
  Badge,
  css,
  DrawerSection,
  Icon,
  IconButton,
  showConfirmation,
  spacing,
} from '@mongodb-js/compass-components';
import { AssistantChat } from './assistant-chat';
import {
  ASSISTANT_DRAWER_ID,
  AssistantActionsContext,
  AssistantContext,
} from './compass-assistant-provider';
import { usePreference } from 'compass-preferences-model/provider';

const assistantTitleStyles = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});

const assistantTitleTextStyles = css({
  marginRight: spacing[200],
});

/**
 * CompassAssistantDrawer component that wraps AssistantChat in a DrawerSection.
 * This component can be placed at any level in the component tree as long as
 * it's within an AssistantProvider.
 */
export const CompassAssistantDrawer: React.FunctionComponent<{
  autoOpen?: boolean;
  hasNonGenuineConnections?: boolean;
}> = ({ autoOpen, hasNonGenuineConnections = false }) => {
  const chat = useContext(AssistantContext);
  const { clearChat } = useContext(AssistantActionsContext);

  const enableAIAssistant = usePreference('enableAIAssistant');

  const handleClearChat = useCallback(async () => {
    const confirmed = await showConfirmation({
      title: 'Clear this chat?',
      description:
        'The current chat will be cleared, and chat history will not be retrievable.',
      buttonText: 'Clear chat',
      variant: 'danger',
      'data-testid': 'assistant-confirm-clear-chat-modal',
    });
    if (confirmed) {
      clearChat?.();
    }
  }, [clearChat]);

  if (!enableAIAssistant) {
    return null;
  }

  if (!chat) {
    throw new Error(
      'CompassAssistantDrawer must be used within an CompassAssistantProvider'
    );
  }

  return (
    <DrawerSection
      id={ASSISTANT_DRAWER_ID}
      title={
        <div className={assistantTitleStyles}>
          <div>
            <span className={assistantTitleTextStyles}>MongoDB Assistant</span>
            <Badge variant="blue">Preview</Badge>
          </div>
          <IconButton
            aria-label="Clear chat"
            onClick={() => {
              void handleClearChat();
            }}
            title="Clear chat"
            data-testid="assistant-clear-chat"
          >
            <Icon glyph="Eraser" />
          </IconButton>
        </div>
      }
      label="MongoDB Assistant"
      glyph="Sparkle"
      autoOpen={autoOpen}
    >
      <AssistantChat
        chat={chat}
        hasNonGenuineConnections={hasNonGenuineConnections}
      />
    </DrawerSection>
  );
};
