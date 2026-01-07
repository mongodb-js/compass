import { Chat } from '../src/@ai-sdk/react/chat-react';
import sinon from 'sinon';
import type { AssistantMessage } from '../src/compass-assistant-provider';

export const createMockChat = ({
  messages,
  status,
  transport,
}: {
  messages: AssistantMessage[];
  status?: Chat<AssistantMessage>['status'];
  transport?: Chat<AssistantMessage>['transport'];
}) => {
  const newChat = new Chat<AssistantMessage>({
    messages,
    transport,
  });
  sinon.replace(newChat, 'sendMessage', sinon.stub());
  if (status) {
    sinon.replaceGetter(newChat, 'status', () => status);
  }
  return newChat as unknown as Chat<AssistantMessage> & {
    sendMessage: sinon.SinonStub;
  };
};

export function createBrokenTransport() {
  const testError = new Error('Test connection error');
  testError.name = 'ConnectionError';
  const transport = {
    sendMessages: sinon.stub().rejects(testError),
    reconnectToStream: sinon.stub().resolves(null),
  };
  return transport;
}

export function createBrokenChat() {
  const chat = new Chat<AssistantMessage>({
    messages: [],
    transport: createBrokenTransport(),
  });
  return chat;
}
