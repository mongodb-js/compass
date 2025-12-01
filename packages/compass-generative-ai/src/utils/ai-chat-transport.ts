import {
  type ChatTransport,
  type LanguageModel,
  type UIMessageChunk,
  type UIMessage,
  convertToModelMessages,
  streamText,
} from 'ai';

type ChatMessageMetadata = {
  confirmation?: boolean;
  instructions?: string;
  sendWithoutHistory?: boolean;
};
type ChatMessage = UIMessage<ChatMessageMetadata>;

export type SendMessagesPayload = Parameters<
  ChatTransport<ChatMessage>['sendMessages']
>[0];

/** Returns true if the message should be excluded from being sent to the API. */
export function shouldExcludeMessage({ metadata }: ChatMessage) {
  if (metadata?.confirmation) {
    return true;
  }
  return false;
}

export class AiChatTransport implements ChatTransport<ChatMessage> {
  private model: LanguageModel;

  constructor({ model }: { model: LanguageModel }) {
    this.model = model;
  }

  static emptyStream = new ReadableStream<UIMessageChunk>({
    start(controller) {
      controller.close();
    },
  });

  sendMessages({ messages, abortSignal }: SendMessagesPayload) {
    // If the most recent message is a message that is meant to be excluded
    // then we do not need to send this request to the assistant API as it's likely
    // redundant otherwise.
    if (shouldExcludeMessage(messages[messages.length - 1])) {
      return Promise.resolve(AiChatTransport.emptyStream);
    }

    const filteredMessages = messages.filter(
      (message) => !shouldExcludeMessage(message)
    );

    // If no messages remain after filtering, return an empty stream
    if (filteredMessages.length === 0) {
      return Promise.resolve(AiChatTransport.emptyStream);
    }

    const lastMessage = filteredMessages[filteredMessages.length - 1];
    const result = streamText({
      model: this.model,
      messages: lastMessage.metadata?.sendWithoutHistory
        ? convertToModelMessages([lastMessage])
        : convertToModelMessages(filteredMessages),
      abortSignal: abortSignal,
      providerOptions: {
        openai: {
          store: false,
          instructions: lastMessage.metadata?.instructions ?? '',
        },
      },
    });

    return Promise.resolve(result.toUIMessageStream({ sendSources: true }));
  }

  reconnectToStream(): Promise<ReadableStream<UIMessageChunk> | null> {
    // For this implementation, we don't support reconnecting to streams
    return Promise.resolve(null);
  }
}
