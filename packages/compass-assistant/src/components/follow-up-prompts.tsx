import React from 'react';
import {
  css,
  LgChatMessagePrompts,
  spacing,
  useDarkMode,
} from '@mongodb-js/compass-components';
import { FOLLOW_UP_QUESTIONS_HEADER } from '../prompts';

const { MessagePrompts, MessagePrompt } = LgChatMessagePrompts;

/** Splits an AI response into the display text (before FOLLOW_UP_QUESTIONS_HEADER) and the extracted questions. */
export function parseFollowUpQuestions(
  text: string,
  {
    isLastMessage,
    isResponseComplete,
  }: { isLastMessage: boolean; isResponseComplete: boolean }
): {
  strippedText: string;
  questions: string[];
} {
  const marker = '\n' + FOLLOW_UP_QUESTIONS_HEADER;
  const headerIndex = text.indexOf(marker);
  if (headerIndex === -1) {
    return { strippedText: text, questions: [] };
  }

  const strippedText = text.slice(0, headerIndex).trimEnd();

  // No need to parse questions and only return stripped text if it is mid-stream or for older messages.
  if (!isLastMessage || !isResponseComplete) {
    return { strippedText, questions: [] };
  }

  const newlineAfterHeader = text.indexOf('\n', headerIndex + 1);
  if (newlineAfterHeader === -1) {
    return { strippedText, questions: [] };
  }
  const contentStart = newlineAfterHeader + 1;
  const questions = text
    .slice(contentStart)
    .split('\n')
    .map((line) => line.trim().replace(/^\d+\.\s*/, ''))
    .filter((q) => q.length > 0);

  // Fallback: response is complete but format is unexpected (no numbered lines).
  // Ideally we should not reach this since the prompt instructs the AI to use
  // numbered format. Return the full original text to avoid losing the follow-up content.
  if (questions.length === 0) {
    return { strippedText: text, questions: [] };
  }

  return { strippedText, questions };
}

const followUpPromptsStyles = css({
  paddingLeft: spacing[400],
  paddingRight: spacing[400],
  paddingBottom: spacing[200],
  width: '100%',
});

export const FollowUpPrompts: React.FunctionComponent<{
  questions: string[];
  onSend: (question: string) => void;
}> = ({ questions, onSend }) => {
  const darkMode = useDarkMode();

  if (questions.length === 0) {
    return null;
  }

  return (
    <MessagePrompts
      label="Suggested Prompts"
      enableHideOnSelect={true}
      darkMode={darkMode}
      className={followUpPromptsStyles}
    >
      {questions.map((question, index) => (
        <MessagePrompt
          key={index}
          onClick={() => onSend(question)}
          data-testid={`follow-up-prompt-${index}`}
        >
          {question}
        </MessagePrompt>
      ))}
    </MessagePrompts>
  );
};
