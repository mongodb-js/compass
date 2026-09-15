// Copyright 2023 Vercel, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import type { AbstractChat, ChatInit, CreateUIMessage, UIMessage } from 'ai';
import { useCallback, useEffect, useRef } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';
import { Chat } from './chat-react';

export type { CreateUIMessage, UIMessage };

// Caps how often streamed message updates reach React.
export const MESSAGES_UPDATE_THROTTLE_MS = 50;
export const MAX_MESSAGES_UPDATE_THROTTLE_MS = 150;
// Body size in characters at which the wait reaches its maximum.
const THROTTLE_SCALE_CHARS = 8_000;

/**
 * Re-rendering costs more as the streamed message grows, so widening the window
 * as it grows keeps the total work roughly linear rather than quadratic, at the
 * price of a chunkier stream on long answers.
 */
export function throttleWaitFor(
  baseWaitMs: number,
  messages: UIMessage[]
): number {
  const streaming = messages[messages.length - 1];
  if (!streaming) {
    return baseWaitMs;
  }

  let size = 0;
  for (const part of streaming.parts) {
    if (part.type === 'text') {
      size += part.text.length;
    }
  }

  const maxWaitMs = Math.max(baseWaitMs, MAX_MESSAGES_UPDATE_THROTTLE_MS);
  const ratio = Math.min(1, size / THROTTLE_SCALE_CHARS);
  return baseWaitMs + (maxWaitMs - baseWaitMs) * ratio;
}

export type UseChatHelpers<UI_MESSAGE extends UIMessage> = {
  /**
   * The id of the chat.
   */
  readonly id: string;

  /**
   * Update the `messages` state locally. This is useful when you want to
   * edit the messages on the client, and then trigger the `reload` method
   * manually to regenerate the AI response.
   */
  setMessages: (
    messages: UI_MESSAGE[] | ((messages: UI_MESSAGE[]) => UI_MESSAGE[])
  ) => void;

  error: Error | undefined;
} & Pick<
  AbstractChat<UI_MESSAGE>,
  | 'sendMessage'
  | 'regenerate'
  | 'stop'
  | 'resumeStream'
  | 'addToolResult'
  | 'addToolApprovalResponse'
  | 'status'
  | 'messages'
  | 'clearError'
>;

export type UseChatOptions<UI_MESSAGE extends UIMessage> = (
  | { chat: Chat<UI_MESSAGE> }
  | ChatInit<UI_MESSAGE>
) & {
  /**
Custom throttle wait in ms for the chat messages and data updates.
Defaults to `MESSAGES_UPDATE_THROTTLE_MS`; pass 0 to disable throttling.
   */
  experimental_throttle?: number;

  /**
   * Whether to resume an ongoing chat generation stream.
   */
  resume?: boolean;
};

export function useChat<UI_MESSAGE extends UIMessage = UIMessage>({
  experimental_throttle: throttleWaitMs = MESSAGES_UPDATE_THROTTLE_MS,
  resume = false,
  ...options
}: UseChatOptions<UI_MESSAGE> = {}): UseChatHelpers<UI_MESSAGE> {
  const chatRef = useRef('chat' in options ? options.chat : new Chat(options));

  const subscribeToMessages = useCallback(
    (update: () => void) =>
      chatRef.current['~registerMessagesCallback'](
        update,
        // An explicit 0 disables throttling, as it does upstream.
        throttleWaitMs
          ? () => throttleWaitFor(throttleWaitMs, chatRef.current.messages)
          : undefined
      ),
    [throttleWaitMs]
  );

  const messages = useSyncExternalStore(
    subscribeToMessages,
    () => chatRef.current.messages,
    () => chatRef.current.messages
  );

  const status = useSyncExternalStore(
    chatRef.current['~registerStatusCallback'],
    () => chatRef.current.status,
    () => chatRef.current.status
  );

  const error = useSyncExternalStore(
    chatRef.current['~registerErrorCallback'],
    () => chatRef.current.error,
    () => chatRef.current.error
  );

  const setMessages = useCallback(
    (
      messagesParam: UI_MESSAGE[] | ((messages: UI_MESSAGE[]) => UI_MESSAGE[])
    ) => {
      if (typeof messagesParam === 'function') {
        // Read via the ref so this callback stays stable across updates.
        messagesParam = messagesParam(chatRef.current.messages);
      }

      chatRef.current.messages = messagesParam;
    },
    [chatRef]
  );

  useEffect(() => {
    if (resume) {
      void chatRef.current.resumeStream();
    }
  }, [resume, chatRef]);

  return {
    id: chatRef.current.id,
    messages,
    setMessages,
    sendMessage: chatRef.current.sendMessage,
    regenerate: chatRef.current.regenerate,
    clearError: chatRef.current.clearError,
    stop: chatRef.current.stop,
    error,
    resumeStream: chatRef.current.resumeStream,
    status,
    addToolResult: chatRef.current.addToolResult,
    addToolApprovalResponse: chatRef.current.addToolApprovalResponse,
  };
}
