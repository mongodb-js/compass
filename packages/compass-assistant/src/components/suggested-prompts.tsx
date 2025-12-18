import React, { useMemo, useState } from 'react';
import {
  css,
  LgChatMessagePrompts,
  spacing,
  useDarkMode,
} from '@mongodb-js/compass-components';
import { useAssistantGlobalState } from '../assistant-global-state';
import type { AssistantMessage } from '../compass-assistant-provider';
import type { Chat } from '../@ai-sdk/react/chat-react';

const { MessagePrompts, MessagePrompt } = LgChatMessagePrompts;

export type SuggestedPromptConfig = {
  message: string;
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
            message: 'How can I modify or delete multiple documents at once?',
          },
          {
            message:
              "How can I improve the performance of my query in Compass? Use the `explain` tool to get the query's explain output and include it in your analysis.",
            metadata: {
              displayText:
                'How can I improve the performance of my query in Compass?',
            },
          },
          {
            message: 'Why is my query returning no results?',
          },
          {
            message: 'How can I export my query code?',
          },
        ];
      case 'Aggregations':
        return [
          {
            message: 'What is an aggregation pipeline?',
          },
          {
            message:
              "How can I improve the performance of my aggregation in Compass? Use the `explain` tool to get the aggregation's explain output and include it in your analysis.",
            metadata: {
              displayText:
                'How can I improve the performance of my aggregation in Compass?',
            },
          },
          {
            message: 'Why is my aggregation pipeline returning no results?',
          },
          {
            message: 'How can I export my aggregation pipeline code?',
          },
        ];
      case 'Schema':
        return [
          {
            message:
              'What are some MongoDB data modeling best practices and anti-patterns?',
          },
          {
            message:
              'How can I visualize the relationships between fields in Compass?',
          },
          {
            message: "How can I export my collection's schema?",
          },
        ];
      case 'Validation':
        return [
          {
            message: 'What are validation rules?',
          },
          {
            message: 'When is it helpful to set validation rules?',
          },
          {
            message: 'Can you show examples of JSON Schema for validation?',
          },
        ];
    }
  }

  // Workspace types
  if (activeWorkspaceType === 'Data Modeling') {
    return [
      {
        message:
          'What are some MongoDB data modeling best practices and anti-patterns?',
      },
      {
        message:
          'Can I plan changes to my data model without affecting actual data?',
      },
      {
        message: 'How do I share my Compass data model with others?',
      },
    ];
  }

  // Default to generic prompts for other tabs
  return [
    {
      message:
        'What can I do with MongoDB Compass, and what are some usage tips?',
    },
    {
      message: 'How can I optimize performance in MongoDB Compass?',
    },
    {
      message: 'How do I connect to my MongoDB deployment?',
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
  onMessageSend: (
    messageBody: string,
    { metadata }: { metadata?: AssistantMessage['metadata'] }
  ) => void;
}> = ({ chat, onMessageSend }) => {
  const darkMode = useDarkMode();
  const [selectedState, setSelectedState] = useState<{
    key: string;
    index: number | undefined;
  }>({ key: '', index: undefined });

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

  // Derive the selected index - reset if the key doesn't match
  const selectedIndex =
    selectedState.key === promptsKey ? selectedState.index : undefined;

  if (prompts.length === 0) {
    return null;
  }

  const handlePromptClick = (index: number, prompt: SuggestedPromptConfig) => {
    setSelectedState({ key: promptsKey, index });
    // Send the full message (which may include additional instructions)
    // while the UI shows the cleaner displayMessage
    onMessageSend(prompt.message, { metadata: prompt.metadata });
  };

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
          selected={selectedIndex === index}
          onClick={() => handlePromptClick(index, prompt)}
          data-testid={`suggested-action-${index}`}
        >
          {prompt.metadata?.displayText ?? prompt.message}
        </MessagePrompt>
      ))}
    </MessagePrompts>
  );
};
