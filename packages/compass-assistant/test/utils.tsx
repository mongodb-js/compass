import { Chat } from '../src/@ai-sdk/react/chat-react';
import sinon from 'sinon';
import type { AssistantMessage } from '../src/compass-assistant-provider';

export const createMockChat = ({
  messages,
  status,
}: {
  messages: AssistantMessage[];
  status?: 'submitted' | 'streaming';
}) => {
  const newChat = new Chat<AssistantMessage>({
    messages,
  });
  sinon.replace(newChat, 'sendMessage', sinon.stub());
  if (status) {
    sinon.replaceGetter(newChat, 'status', () => status);
  }
  return newChat as unknown as Chat<AssistantMessage> & {
    sendMessage: sinon.SinonStub;
  };
};
