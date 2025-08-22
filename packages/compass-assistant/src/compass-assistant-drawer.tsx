import React, { useCallback, useContext } from 'react';
import {
  DrawerSection,
  Icon,
  IconButton,
  showConfirmation,
} from '@mongodb-js/compass-components';
import { AssistantChat } from './assistant-chat';
import {
  ASSISTANT_DRAWER_ID,
  AssistantActionsContext,
  AssistantContext,
} from './compass-assistant-provider';
import { usePreference } from 'compass-preferences-model/provider';

/**
 * CompassAssistantDrawer component that wraps AssistantChat in a DrawerSection.
 * This component can be placed at any level in the component tree as long as
 * it's within an AssistantProvider.
 */
export const CompassAssistantDrawer: React.FunctionComponent<{
  autoOpen?: boolean;
}> = ({ autoOpen }) => {
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
    });
    if (confirmed) {
      clearChat();
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>MongoDB Assistant</span>
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
      <AssistantChat chat={chat} />
    </DrawerSection>
  );
};
