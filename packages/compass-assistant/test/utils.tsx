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

export function withMockedScrollTo() {
  let originalScrollTo: typeof Element.prototype.scrollTo;
  // Mock scrollTo method for DOM elements to prevent test failures
  before(function () {
    originalScrollTo = Element.prototype.scrollTo;
    if (!Element.prototype.scrollTo) {
      Element.prototype.scrollTo = () => {};
    }
  });
  after(function () {
    Element.prototype.scrollTo = originalScrollTo;
  });
}
