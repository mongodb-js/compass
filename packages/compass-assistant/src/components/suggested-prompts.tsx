import React, { useMemo } from 'react';
import {
  css,
  LgChatMessagePrompts,
  spacing,
  useDarkMode,
} from '@mongodb-js/compass-components';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';
import { usePreference } from 'compass-preferences-model/provider';
import { useAssistantGlobalState } from '../assistant-global-state';
import type {
  AssistantMessage,
  ThreadedChat,
} from '../compass-assistant-provider';
import type { SendMessageOptions } from './assistant-chat';

const { MessagePrompts, MessagePrompt } = LgChatMessagePrompts;

export type SuggestedPromptConfig = {
  id: string;
  text: string;
  metadata?: AssistantMessage['metadata'];
};

const QUERY_OPTIMIZER_PROMPT =
  'Help me understand whether my current query and collection setup will perform well.';

function getSuggestedPromptsForTab(
  activeWorkspaceType: string | undefined,
  activeCollectionSubTab: string | null,
  hasMessages: boolean,
  enableSkills: boolean
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
            id: 'documents-modify-delete',
            text: 'How can I modify or delete multiple documents at once?',
          },
          {
            id: 'documents-query-performance',
            text: "How can I improve the performance of my query in Compass? Use the `explain` tool to get the query's explain output and include it in your analysis.",
            metadata: {
              displayText:
                'How can I improve the performance of my query in Compass?',
            },
          },
          {
            id: 'documents-no-results',
            text: 'Why is my query returning no results?',
          },
          {
            id: 'documents-export-code',
            text: 'How can I export my query code?',
          },
        ];
      case 'Aggregations':
        return [
          {
            id: 'aggregations-what-is-pipeline',
            text: 'What is an aggregation pipeline?',
          },
          {
            id: 'aggregations-performance',
            text: "How can I improve the performance of my aggregation in Compass? Use the `explain` tool to get the aggregation's explain output and include it in your analysis.",
            metadata: {
              displayText:
                'How can I improve the performance of my aggregation in Compass?',
            },
          },
          {
            id: 'aggregations-no-results',
            text: 'Why is my aggregation pipeline returning no results?',
          },
          {
            id: 'aggregations-export-code',
            text: 'How can I export my aggregation pipeline code?',
          },
        ];
      case 'Schema':
        return [
          {
            id: 'schema-data-modeling-best-practices',
            text: 'What are some MongoDB data modeling best practices and anti-patterns?',
          },
          {
            id: 'schema-visualize-relationships',
            text: 'How can I visualize the relationships between fields in Compass?',
          },
          {
            id: 'schema-export',
            text: "How can I export my collection's schema?",
          },
        ];
      case 'Validation':
        return [
          {
            id: 'validation-what-are-rules',
            text: 'What are validation rules?',
          },
          {
            id: 'validation-when-helpful',
            text: 'When is it helpful to set validation rules?',
          },
          {
            id: 'validation-json-schema-examples',
            text: 'Can you show examples of JSON Schema for validation?',
          },
        ];
    }
  }

  // Workspace types
  if (activeWorkspaceType === 'Data Modeling') {
    return [
      {
        id: 'data-modeling-best-practices',
        text: 'What are some MongoDB data modeling best practices and anti-patterns?',
      },
      {
        id: 'data-modeling-plan-changes',
        text: 'Can I plan changes to my data model without affecting actual data?',
      },
      {
        id: 'data-modeling-share',
        text: 'How do I share my Compass data model with others?',
      },
    ];
  }

  // Default to generic prompts for other tabs
  return [
    {
      id: 'generic-usage-tips',
      text: 'What can I do with MongoDB Compass, and what are some usage tips?',
    },
    enableSkills
      ? {
          id: 'generic-query-optimizer-skill',
          text: `<skill>mongodb-query-optimizer</skill> ${QUERY_OPTIMIZER_PROMPT}`,
          metadata: {
            displayText: `/query-optimizer ${QUERY_OPTIMIZER_PROMPT}`,
          },
        }
      : {
          id: 'generic-optimize-performance',
          text: 'How can I optimize performance in MongoDB Compass?',
        },
    {
      id: 'generic-connect',
      text: 'How do I connect to my MongoDB deployment?',
    },
  ];
}

const suggestedPromptsStyles = css({
  paddingLeft: spacing[400],
  paddingRight: spacing[400],
  paddingBottom: spacing[200],
  width: '100%',
});

export const SuggestedPrompts: React.FunctionComponent<{
  chat: ThreadedChat;
  onMessageSend: (options: SendMessageOptions) => Promise<void>;
}> = ({ chat, onMessageSend }) => {
  const darkMode = useDarkMode();
  const track = useTelemetry();
  const enableSkills = usePreference('enableSkillsInAssistant');

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
        hasMessages,
        enableSkills
      ),
    [activeWorkspaceType, activeCollectionSubTab, hasMessages, enableSkills]
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
      {prompts.map(({ id, ...message }, index) => {
        const label = message.metadata?.displayText ?? message.text;
        return (
          <MessagePrompt
            key={index}
            onClick={() => {
              track('Assistant Suggested Prompt Selected', {
                suggested_prompt_id: id,
                thread_id: chat.threadId,
              });
              void onMessageSend(message);
            }}
            data-testid={`suggested-action-${index}`}
          >
            {label}
          </MessagePrompt>
        );
      })}
    </MessagePrompts>
  );
};
