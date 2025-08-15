import type { UIMessage } from 'ai';
import { Chat } from '../src/@ai-sdk/react/chat-react';
import sinon from 'sinon';

export const createMockChat = ({ messages }: { messages: UIMessage[] }) => {
  const newChat = new Chat<UIMessage>({
    messages,
  });
  sinon.replace(newChat, 'sendMessage', sinon.stub());
  return newChat as unknown as Chat<UIMessage> & {
    sendMessage: sinon.SinonStub;
  };
};
