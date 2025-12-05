import React, { useCallback, useContext } from 'react';
import {
  Badge,
  css,
  DrawerSection,
  Icon,
  IconButton,
  showConfirmation,
  spacing,
  Tooltip,
} from '@mongodb-js/compass-components';
import { AssistantChat } from './components/assistant-chat';
import {
  ASSISTANT_DRAWER_ID,
  AssistantContext,
  type AssistantMessage,
} from './compass-assistant-provider';
import {
  useIsAIFeatureEnabled,
  usePreference,
} from 'compass-preferences-model/provider';
import { useChat } from './@ai-sdk/react/use-chat';
import type { Chat } from './@ai-sdk/react/chat-react';

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

  const enableAIAssistant = usePreference('enableAIAssistant');
  const isAiFeatureEnabled = useIsAIFeatureEnabled();

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
          <ClearChatButton chat={chat} />
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

export const ClearChatButton: React.FunctionComponent<{
  chat: Chat<AssistantMessage>;
}> = ({ chat }) => {
  const { clearError, stop } = useChat({ chat });

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
      await stop();
      clearError();
      // Instead of breaking React rules, we should probably expose the "clear"
      // as an interface on the chat class. Otherwise it's kinda expected taht
      // we "mutate" messages directly to update the state
      // eslint-disable-next-line react-hooks/immutability
      chat.messages = chat.messages.filter(
        (message) => message.metadata?.isPermanent
      );
    }
  }, [stop, clearError, chat]);

  const isChatEmpty =
    chat.messages.filter((message) => !message.metadata?.isPermanent).length ===
    0;

  if (isChatEmpty) {
    return null;
  }

  return (
    <Tooltip
      trigger={
        <IconButton
          onClick={() => {
            void handleClearChat();
          }}
          title="Clear chat"
          aria-label="Clear chat"
          aria-hidden={true}
          data-testid="assistant-clear-chat"
        >
          <Icon glyph="Eraser" />
        </IconButton>
      }
    >
      Clear chat
    </Tooltip>
  );
};
