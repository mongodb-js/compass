import React, { useMemo } from 'react';
import {
  css,
  LgChatMessagePrompts,
  spacing,
  useDarkMode,
} from '@mongodb-js/compass-components';
import { useAssistantGlobalState } from '../assistant-global-state';
import type { AssistantMessage } from '../compass-assistant-provider';
import type { Chat } from '../@ai-sdk/react/chat-react';
import type { SendMessageOptions } from './assistant-chat';

const { MessagePrompts, MessagePrompt } = LgChatMessagePrompts;

export type SuggestedPromptConfig = {
  text: string;
  metadata?: AssistantMessage['metadata'];
};

function getSuggestedPromptsForTab(
  activeWorkspaceType: string | undefined,
  activeCollectionSubTab: string | null,
  hasMessages: boolean
): SuggestedPromptConfig[] {
  if (hasMessages) {
    return [];
  }

  // Collection subtabs take precedence
  if (activeWorkspaceType === 'Collection' && activeCollectionSubTab) {
    switch (activeCollectionSubTab) {
      case 'Documents':
        return [
          {
            text: 'How can I modify or delete multiple documents at once?',
          },
          {
            text: "How can I improve the performance of my query in Compass? Use the `explain` tool to get the query's explain output and include it in your analysis.",
            metadata: {
              displayText:
                'How can I improve the performance of my query in Compass?',
            },
          },
          {
            text: 'Why is my query returning no results?',
          },
          {
            text: 'How can I export my query code?',
          },
        ];
      case 'Aggregations':
        return [
          {
            text: 'What is an aggregation pipeline?',
          },
          {
            text: "How can I improve the performance of my aggregation in Compass? Use the `explain` tool to get the aggregation's explain output and include it in your analysis.",
            metadata: {
              displayText:
                'How can I improve the performance of my aggregation in Compass?',
            },
          },
          {
            text: 'Why is my aggregation pipeline returning no results?',
          },
          {
            text: 'How can I export my aggregation pipeline code?',
          },
        ];
      case 'Schema':
        return [
          {
            text: 'What are some MongoDB data modeling best practices and anti-patterns?',
          },
          {
            text: 'How can I visualize the relationships between fields in Compass?',
          },
          {
            text: "How can I export my collection's schema?",
          },
        ];
      case 'Validation':
        return [
          {
            text: 'What are validation rules?',
          },
          {
            text: 'When is it helpful to set validation rules?',
          },
          {
            text: 'Can you show examples of JSON Schema for validation?',
          },
        ];
    }
  }

  // Workspace types
  if (activeWorkspaceType === 'Data Modeling') {
    return [
      {
        text: 'What are some MongoDB data modeling best practices and anti-patterns?',
      },
      {
        text: 'Can I plan changes to my data model without affecting actual data?',
      },
      {
        text: 'How do I share my Compass data model with others?',
      },
    ];
  }

  // Default to generic prompts for other tabs
  return [
    {
      text: 'What can I do with MongoDB Compass, and what are some usage tips?',
    },
    {
      text: 'How can I optimize performance in MongoDB Compass?',
    },
    {
      text: 'How do I connect to my MongoDB deployment?',
    },
  ];
}

const suggestedPromptsStyles = css({
  paddingLeft: spacing[400],
  paddingRight: spacing[400],
  paddingBottom: spacing[200],
});

export const SuggestedPrompts: React.FunctionComponent<{
  chat: Chat<AssistantMessage>;
  onMessageSend: (options: SendMessageOptions) => Promise<void>;
}> = ({ chat, onMessageSend }) => {
  const darkMode = useDarkMode();

  const { activeWorkspace, activeCollectionSubTab } = useAssistantGlobalState();
  const activeWorkspaceType = activeWorkspace?.type;

  const hasMessages = chat.messages.length > 0;
  const chatId = chat.id;
  // Resolve prompts based on current tab
  const prompts = useMemo(
    () =>
      getSuggestedPromptsForTab(
        activeWorkspaceType,
        activeCollectionSubTab,
        hasMessages
      ),
    [activeWorkspaceType, activeCollectionSubTab, hasMessages]
  );

  // Create a unique key based on workspace type, subtab, and chat ID
  // This is used to reset the state of the selected index which is currently
  // not expected from the component's props.
  const promptsKey = useMemo(
    () =>
      `${chatId}-${activeWorkspaceType ?? 'none'}-${
        activeCollectionSubTab ?? 'none'
      }`,
    [chatId, activeWorkspaceType, activeCollectionSubTab]
  );

  if (prompts.length === 0) {
    return null;
  }

  return (
    <MessagePrompts
      key={promptsKey}
      label="Suggested Actions"
      enableHideOnSelect={true}
      darkMode={darkMode}
      className={suggestedPromptsStyles}
    >
      {prompts.map((prompt, index) => (
        <MessagePrompt
          key={index}
          onClick={() => void onMessageSend(prompt)}
          data-testid={`suggested-action-${index}`}
        >
          {prompt.metadata?.displayText ?? prompt.text}
        </MessagePrompt>
      ))}
    </MessagePrompts>
  );
};
