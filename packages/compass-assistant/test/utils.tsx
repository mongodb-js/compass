import { Chat } from '../src/@ai-sdk/react/chat-react';
import sinon from 'sinon';
import type { AssistantMessage } from '../src/compass-assistant-provider';

export const createMockChat = ({
  messages,
}: {
  messages: AssistantMessage[];
}) => {
  const newChat = new Chat<AssistantMessage>({
    messages,
  });
  sinon.replace(newChat, 'sendMessage', sinon.stub());
  return newChat as unknown as Chat<AssistantMessage> & {
    sendMessage: sinon.SinonStub;
  };
};
