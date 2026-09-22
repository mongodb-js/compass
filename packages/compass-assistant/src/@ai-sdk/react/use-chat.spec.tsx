import React from 'react';
import { render, waitFor } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import type { AssistantMessage } from '../../compass-assistant-provider';
import { Chat } from './chat-react';
import { useChat } from './use-chat';

function textMessage(id: string): AssistantMessage {
  return {
    id,
    role: 'assistant',
    parts: [{ type: 'text', text: id }],
  };
}

describe('useChat', function () {
  let chat: Chat<AssistantMessage>;
  let helpers: ReturnType<typeof useChat<AssistantMessage>>;
  let renderCount: number;
  let setMessagesIdentities: Set<unknown>;

  function TestComponent() {
    helpers = useChat<AssistantMessage>({ chat });
    renderCount++;
    setMessagesIdentities.add(helpers.setMessages);
    return <div>{helpers.messages.map((message) => message.id).join(',')}</div>;
  }

  beforeEach(function () {
    chat = new Chat<AssistantMessage>({ messages: [textMessage('a')] });
    renderCount = 0;
    setMessagesIdentities = new Set();
    render(<TestComponent />);
  });

  it('keeps setMessages stable across re-renders', async function () {
    chat.messages = [...chat.messages, textMessage('b')];

    await waitFor(() => {
      expect(renderCount).to.be.greaterThan(1);
    });
    expect(setMessagesIdentities.size).to.equal(1);
  });

  it('passes the latest messages to a functional update', function () {
    // Two updates in one tick, so the second runs before React re-renders.
    helpers.setMessages((messages) => [...messages, textMessage('b')]);
    helpers.setMessages((messages) => [...messages, textMessage('c')]);

    expect(chat.messages.map((message) => message.id)).to.deep.equal([
      'a',
      'b',
      'c',
    ]);
  });

  it('passes messages that arrived since the last render to a functional update', function () {
    // A chunk landing in the store mid-stream, before React re-renders.
    chat.messages = [...chat.messages, textMessage('streamed')];

    helpers.setMessages((messages) => [...messages, textMessage('b')]);

    expect(chat.messages.map((message) => message.id)).to.deep.equal([
      'a',
      'streamed',
      'b',
    ]);
  });
});
