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
import { AssistantChat } from './components/assistant-chat';
import {
  ASSISTANT_DRAWER_ID,
  AssistantActionsContext,
  AssistantContext,
} from './compass-assistant-provider';
import {
  useIsAIFeatureEnabled,
  usePreference,
} from 'compass-preferences-model/provider';

const assistantTitleStyles = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});

const assistantTitleTextWrapperStyles = css({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  transition: 'transform 0.16s ease-in',

  // Shrink the title text and badge when the drawer is narrow
  '@container (width < 320px)': {
    '&': {
      transform: 'scale(0.8) translateX(-10%)',
    },
  },
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
  appName: string;
  autoOpen?: boolean;
  hasNonGenuineConnections?: boolean;
}> = ({ appName, autoOpen, hasNonGenuineConnections = false }) => {
  const chat = useContext(AssistantContext);
  const { clearChat } = useContext(AssistantActionsContext);

  const enableAIAssistant = usePreference('enableAIAssistant');
  const isAiFeatureEnabled = useIsAIFeatureEnabled();

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
      await clearChat?.();
    }
  }, [clearChat]);

  if (!enableAIAssistant || !isAiFeatureEnabled) {
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
          <div className={assistantTitleTextWrapperStyles}>
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
      guideCue={{
        cueId: 'assistant-drawer',
        title: 'Introducing MongoDB Assistant',
        description: `AI-powered assistant to intelligently guide you through your database tasks. Get expert MongoDB help and streamline your workflow directly within ${appName}.`,
        buttonText: 'Got it',
        tooltipAlign: 'left',
        tooltipJustify: 'start',
      }}
    >
      <AssistantChat
        chat={chat}
        hasNonGenuineConnections={hasNonGenuineConnections}
      />
    </DrawerSection>
  );
};
