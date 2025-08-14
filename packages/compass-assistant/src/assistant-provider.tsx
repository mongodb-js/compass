import React, { type PropsWithChildren, useRef } from 'react';
import { type UIMessage } from './@ai-sdk/react/use-chat';
import type { Chat } from './@ai-sdk/react/chat-react';
import { usePreference } from 'compass-preferences-model/provider';
import { createContext, useContext } from 'react';

export const ASSISTANT_DRAWER_ID = 'compass-assistant-drawer';

interface AssistantContextType {
  chat: Chat<UIMessage>;
  isEnabled: boolean;
}

export const AssistantContext = createContext<AssistantContextType | null>(
  null
);

type AssistantActionsContextType = unknown;
export const AssistantActionsContext =
  createContext<AssistantActionsContextType>({});

export function useAssistantActions(): AssistantActionsContextType {
  return useContext(AssistantActionsContext);
}

export const AssistantProvider: React.FunctionComponent<
  PropsWithChildren<{
    chat: Chat<UIMessage>;
  }>
> = ({ chat, children }) => {
  const enableAIAssistant = usePreference('enableAIAssistant');

  const assistantContext = useRef<AssistantContextType>({
    chat,
    isEnabled: enableAIAssistant,
  });
  assistantContext.current = {
    chat,
    isEnabled: enableAIAssistant,
  };

  const assistantActionsContext = useRef<AssistantActionsContextType>({});

  if (!enableAIAssistant) {
    return <>{children}</>;
  }

  return (
    <AssistantContext.Provider value={assistantContext.current}>
      <AssistantActionsContext.Provider value={assistantActionsContext.current}>
        {children}
      </AssistantActionsContext.Provider>
    </AssistantContext.Provider>
  );
};

// Keep the old component name for backward compatibility during transition
export const AssistantDrawerSection = AssistantProvider;
