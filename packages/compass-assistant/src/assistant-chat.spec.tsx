import React from 'react';
import { render, screen, userEvent } from '@mongodb-js/testing-library-compass';
import { AssistantChat } from './assistant-chat';
import { expect } from 'chai';
import { createMockChat } from '../test/utils';
import type { AssistantMessage } from './compass-assistant-provider';

describe('AssistantChat', function () {
  const mockMessages: AssistantMessage[] = [
    {
      id: 'user',
      role: 'user',
      parts: [{ type: 'text', text: 'Hello, MongoDB Assistant!' }],
    },
    {
      id: 'assistant',
      role: 'assistant',
      parts: [
        {
          type: 'text',
          text: 'Hello! How can I help you with MongoDB today?',
        },
      ],
    },
  ];

  function renderWithChat(messages: AssistantMessage[]) {
    const chat = createMockChat({ messages });
    return {
      result: render(<AssistantChat chat={chat} />),
      chat,
    };
  }

  it('renders input field and send button', function () {
    renderWithChat([]);

    const inputField = screen.getByTestId('assistant-chat-input');
    const sendButton = screen.getByTestId('assistant-chat-send-button');

    expect(inputField).to.exist;
    expect(sendButton).to.exist;
  });

  it('input field accepts text input', function () {
    renderWithChat([]);

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const inputField = screen.getByTestId(
      'assistant-chat-input'
    ) as HTMLInputElement;

    userEvent.type(inputField, 'What is MongoDB?');

    expect(inputField.value).to.equal('What is MongoDB?');
  });

  it('send button is disabled when input is empty', function () {
    renderWithChat([]);

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const sendButton = screen.getByTestId(
      'assistant-chat-send-button'
    ) as HTMLButtonElement;

    expect(sendButton.disabled).to.be.true;
  });

  it('send button is enabled when input has text', function () {
    renderWithChat([]);

    const inputField = screen.getByTestId('assistant-chat-input');
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const sendButton = screen.getByTestId(
      'assistant-chat-send-button'
    ) as HTMLButtonElement;

    userEvent.type(inputField, 'What is MongoDB?');

    expect(sendButton.disabled).to.be.false;
  });

  it('send button is disabled for whitespace-only input', function () {
    renderWithChat([]);

    const inputField = screen.getByTestId('assistant-chat-input');
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const sendButton = screen.getByTestId(
      'assistant-chat-send-button'
    ) as HTMLButtonElement;

    userEvent.type(inputField, '   ');

    expect(sendButton.disabled).to.be.true;
  });

  it('displays messages in the chat feed', function () {
    renderWithChat(mockMessages);

    expect(screen.getByTestId('assistant-message-user')).to.exist;
    expect(screen.getByTestId('assistant-message-assistant')).to.exist;
    expect(screen.getByTestId('assistant-message-user')).to.have.text(
      'Hello, MongoDB Assistant!'
    );
    expect(screen.getByTestId('assistant-message-assistant')).to.have.text(
      'Hello! How can I help you with MongoDB today?'
    );
  });

  it('calls sendMessage when form is submitted', function () {
    const { chat } = renderWithChat([]);
    const inputField = screen.getByTestId('assistant-chat-input');
    const sendButton = screen.getByTestId('assistant-chat-send-button');

    userEvent.type(inputField, 'What is aggregation?');
    userEvent.click(sendButton);

    expect(chat.sendMessage.calledWith({ text: 'What is aggregation?' })).to.be
      .true;
  });

  it('clears input field after successful submission', function () {
    renderWithChat([]);

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const inputField = screen.getByTestId(
      'assistant-chat-input'
    ) as HTMLInputElement;

    userEvent.type(inputField, 'Test message');
    expect(inputField.value).to.equal('Test message');

    userEvent.click(screen.getByTestId('assistant-chat-send-button'));
    expect(inputField.value).to.equal('');
  });

  it('trims whitespace from input before sending', function () {
    const { chat } = renderWithChat([]);

    const inputField = screen.getByTestId('assistant-chat-input');

    userEvent.type(inputField, '  What is sharding?  ');
    userEvent.click(screen.getByTestId('assistant-chat-send-button'));

    expect(chat.sendMessage.calledWith({ text: 'What is sharding?' })).to.be
      .true;
  });

  it('does not call sendMessage when input is empty or whitespace-only', function () {
    const { chat } = renderWithChat([]);

    const inputField = screen.getByTestId('assistant-chat-input');
    const chatForm = screen.getByTestId('assistant-chat-form');

    // Test empty input
    userEvent.click(chatForm);
    expect(chat.sendMessage.notCalled).to.be.true;

    // Test whitespace-only input
    userEvent.type(inputField, '   ');
    userEvent.click(chatForm);
    expect(chat.sendMessage.notCalled).to.be.true;
  });

  it('displays user and assistant messages with different styling', function () {
    renderWithChat(mockMessages);

    const userMessage = screen.getByTestId('assistant-message-user');
    const assistantMessage = screen.getByTestId('assistant-message-assistant');

    // User messages should have different background color than assistant messages
    expect(userMessage).to.exist;
    expect(assistantMessage).to.exist;

    const userStyle = window.getComputedStyle(userMessage);
    const assistantStyle = window.getComputedStyle(assistantMessage);

    expect(userStyle.backgroundColor).to.not.equal(
      assistantStyle.backgroundColor
    );
  });

  it('handles messages with multiple text parts', function () {
    const messagesWithMultipleParts: AssistantMessage[] = [
      {
        id: '1',
        role: 'assistant',
        parts: [
          { type: 'text', text: 'Here is part 1. ' },
          { type: 'text', text: 'And here is part 2.' },
        ],
      },
    ];

    renderWithChat(messagesWithMultipleParts);

    expect(screen.getByText('Here is part 1. And here is part 2.')).to.exist;
  });

  it('handles messages with mixed part types (filters to text only)', function () {
    const messagesWithMixedParts: AssistantMessage[] = [
      {
        id: '1',
        role: 'assistant',
        parts: [
          { type: 'text', text: 'This is text content.' },
          // @ts-expect-error - tool-call is not a valid part type
          { type: 'tool-call', text: 'This should be filtered out.' },
          { type: 'text', text: ' More text content.' },
        ],
      },
    ];

    renderWithChat(messagesWithMixedParts);

    expect(screen.getByText('This is text content. More text content.')).to
      .exist;
    expect(screen.queryByText('This should be filtered out.')).to.not.exist;
  });

  it('displays displayText instead of message parts when displayText is set', function () {
    const messagesWithDisplayText: AssistantMessage[] = [
      {
        id: '1',
        role: 'assistant',
        parts: [
          { type: 'text', text: 'This message part should be ignored.' },
          { type: 'text', text: 'Another part that should not display.' },
        ],
        metadata: {
          displayText: 'This is the custom display text that should show.',
        },
      },
    ];

    renderWithChat(messagesWithDisplayText);

    // Should display the displayText
    expect(
      screen.getByText('This is the custom display text that should show.')
    ).to.exist;

    // Should NOT display the message parts
    expect(screen.queryByText('This message part should be ignored.')).to.not
      .exist;
    expect(screen.queryByText('Another part that should not display.')).to.not
      .exist;
  });
});
