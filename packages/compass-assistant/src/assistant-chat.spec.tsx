import React from 'react';
import {
  render,
  screen,
  userEvent,
  waitFor,
} from '@mongodb-js/testing-library-compass';
import { AssistantChat } from './assistant-chat';
import { expect } from 'chai';
import { createMockChat } from '../test/utils';
import {
  AssistantActionsContext,
  type AssistantMessage,
} from './compass-assistant-provider';
import sinon from 'sinon';

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

    // The chat component does not use chat.sendMessage() directly, it uses
    // ensureOptInAndSend() via the AssistantActionsContext.
    const ensureOptInAndSendStub = sinon
      .stub()
      .callsFake(async (message, options, callback) => {
        // call the callback so we can test the tracking
        callback();

        await chat.sendMessage(message, options);
      });

    const assistantActionsContext = {
      ensureOptInAndSend: ensureOptInAndSendStub,
    };
    const result = render(
      <AssistantActionsContext.Provider value={assistantActionsContext as any}>
        <AssistantChat chat={chat} />
      </AssistantActionsContext.Provider>
    );
    return {
      result,
      chat,
      ensureOptInAndSendStub,
    };
  }

  it('renders input field and send button', function () {
    renderWithChat([]);

    const inputField = screen.getByPlaceholderText(
      'Ask MongoDB Assistant a question'
    );
    const sendButton = screen.getByLabelText('Send message');

    expect(inputField).to.exist;
    expect(sendButton).to.exist;
  });

  it('input field accepts text input', function () {
    renderWithChat([]);

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const inputField = screen.getByPlaceholderText(
      'Ask MongoDB Assistant a question'
    ) as HTMLTextAreaElement;

    userEvent.type(inputField, 'What is MongoDB?');

    expect(inputField.value).to.equal('What is MongoDB?');
  });

  it('send button is disabled when input is empty', function () {
    renderWithChat([]);

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const sendButton = screen.getByLabelText(
      'Send message'
    ) as HTMLButtonElement;

    expect(sendButton.getAttribute('aria-disabled')).to.equal('true');
  });

  it('send button is enabled when input has text', function () {
    renderWithChat([]);

    const inputField = screen.getByPlaceholderText(
      'Ask MongoDB Assistant a question'
    );
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const sendButton = screen.getByLabelText(
      'Send message'
    ) as HTMLButtonElement;

    userEvent.type(inputField, 'What is MongoDB?');

    expect(sendButton.disabled).to.be.false;
  });

  it('send button is disabled for whitespace-only input', async function () {
    renderWithChat([]);

    const inputField = screen.getByPlaceholderText(
      'Ask MongoDB Assistant a question'
    );
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const sendButton = screen.getByLabelText(
      'Send message'
    ) as HTMLButtonElement;

    userEvent.type(inputField, '   ');

    await waitFor(() => {
      expect(sendButton.getAttribute('aria-disabled')).to.equal('true');
    });
  });

  it('displays messages in the chat feed', function () {
    renderWithChat(mockMessages);

    expect(screen.getByTestId('assistant-message-user')).to.exist;
    expect(screen.getByTestId('assistant-message-assistant')).to.exist;
    expect(screen.getByTestId('assistant-message-user')).to.contain.text(
      'Hello, MongoDB Assistant!'
    );
    expect(screen.getByTestId('assistant-message-assistant')).to.contain.text(
      'Hello! How can I help you with MongoDB today?'
    );
  });

  it('calls ensureOptInAndSend when form is submitted', async function () {
    const { ensureOptInAndSendStub, result } = renderWithChat([]);
    const { track } = result;
    const inputField = screen.getByPlaceholderText(
      'Ask MongoDB Assistant a question'
    );
    const sendButton = screen.getByLabelText('Send message');

    userEvent.type(inputField, 'What is aggregation?');
    userEvent.click(sendButton);

    expect(ensureOptInAndSendStub.called).to.be.true;

    await waitFor(() => {
      expect(track).to.have.been.calledWith('Assistant Prompt Submitted', {
        user_input_length: 'What is aggregation?'.length,
      });
    });
  });

  it('clears input field after successful submission', function () {
    renderWithChat([]);

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const inputField = screen.getByPlaceholderText(
      'Ask MongoDB Assistant a question'
    ) as HTMLTextAreaElement;

    userEvent.type(inputField, 'Test message');
    expect(inputField.value).to.equal('Test message');

    userEvent.click(screen.getByLabelText('Send message'));
    expect(inputField.value).to.equal('');
  });

  it('trims whitespace from input before sending', async function () {
    const { ensureOptInAndSendStub, result } = renderWithChat([]);
    const { track } = result;

    const inputField = screen.getByPlaceholderText(
      'Ask MongoDB Assistant a question'
    );

    userEvent.type(inputField, '  What is sharding?  ');
    userEvent.click(screen.getByLabelText('Send message'));

    expect(ensureOptInAndSendStub.called).to.be.true;

    await waitFor(() => {
      expect(track).to.have.been.calledWith('Assistant Prompt Submitted', {
        user_input_length: 'What is sharding?'.length,
      });
    });
  });

  it('does not call ensureOptInAndSend when input is empty or whitespace-only', function () {
    const { ensureOptInAndSendStub } = renderWithChat([]);

    const inputField = screen.getByPlaceholderText(
      'Ask MongoDB Assistant a question'
    );
    const chatForm = screen.getByTestId('assistant-chat-input');

    // Test empty input
    userEvent.click(chatForm);
    expect(ensureOptInAndSendStub.notCalled).to.be.true;

    // Test whitespace-only input
    userEvent.type(inputField, '   ');
    userEvent.click(chatForm);
    expect(ensureOptInAndSendStub.notCalled).to.be.true;
  });

  it('displays user and assistant messages with different styling', function () {
    renderWithChat(mockMessages);

    const userMessage = screen.getByTestId('assistant-message-user');
    const assistantMessage = screen.getByTestId('assistant-message-assistant');

    // User messages should have different class names than assistant messages
    expect(userMessage).to.exist;
    expect(assistantMessage).to.exist;

    // Check that they have different class names (indicating different styling)
    expect(userMessage.className).to.not.equal(assistantMessage.className);
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

  describe('feedback buttons', function () {
    it('shows feedback buttons only for assistant messages', function () {
      renderWithChat(mockMessages);

      const userMessage = screen.getByTestId('assistant-message-user');
      const assistantMessage = screen.getByTestId(
        'assistant-message-assistant'
      );

      // User messages should not have feedback buttons
      expect(userMessage.querySelector('[aria-label="Thumbs Up Icon"]')).to.not
        .exist;
      expect(userMessage.querySelector('[aria-label="Thumbs Down Icon"]')).to
        .not.exist;

      // Assistant messages should have feedback buttons
      expect(assistantMessage.querySelector('[aria-label="Thumbs Up Icon"]')).to
        .exist;
      expect(assistantMessage.querySelector('[aria-label="Thumbs Down Icon"]'))
        .to.exist;
    });

    it('tracks positive feedback when thumbs up is clicked', async function () {
      const { result } = renderWithChat(mockMessages);
      const { track } = result;

      const assistantMessage = screen.getByTestId(
        'assistant-message-assistant'
      );

      // Find and click the thumbs up button
      const thumbsUpButton = assistantMessage.querySelector(
        '[aria-label="Thumbs Up Icon"]'
      ) as HTMLElement;

      userEvent.click(thumbsUpButton);

      await waitFor(() => {
        expect(track).to.have.callCount(1);
        expect(track).to.have.been.calledWith('Assistant Feedback Submitted', {
          feedback: 'positive',
          text: undefined,
          request_id: null,
        });
      });
    });

    it('tracks negative feedback when thumbs down is clicked', async function () {
      const { result } = renderWithChat(mockMessages);
      const { track } = result;

      const assistantMessage = screen.getByTestId(
        'assistant-message-assistant'
      );

      // Find and click the thumbs down button
      const thumbsDownButton = assistantMessage.querySelector(
        '[aria-label="Thumbs Down Icon"]'
      ) as HTMLElement;

      userEvent.click(thumbsDownButton);

      await waitFor(() => {
        expect(track).to.have.callCount(1);

        expect(track).to.have.been.calledWith('Assistant Feedback Submitted', {
          feedback: 'negative',
          text: undefined,
          request_id: null,
        });
      });
    });

    it('tracks detailed feedback when feedback text is submitted', async function () {
      const { result } = renderWithChat(mockMessages);
      const { track } = result;

      const assistantMessage = screen.getByTestId(
        'assistant-message-assistant'
      );

      // First click thumbs down to potentially open feedback form
      const thumbsDownButton = assistantMessage.querySelector(
        '[aria-label="Thumbs Down Icon"]'
      ) as HTMLElement;

      userEvent.click(thumbsDownButton);

      // Look for feedback text area (the exact implementation depends on LeafyGreen)
      const feedbackTextArea = screen.getByTestId(
        'lg-chat-message_actions-feedback_textarea'
      );

      userEvent.type(feedbackTextArea, 'This response was not helpful');

      // Look for submit button
      const submitButton = screen.getByText('Submit');

      userEvent.click(submitButton);

      await waitFor(() => {
        expect(track).to.have.callCount(2);

        expect(track).to.have.been.calledWith('Assistant Feedback Submitted', {
          feedback: 'negative',
          text: undefined,
          request_id: null,
        });

        expect(track).to.have.been.calledWith('Assistant Feedback Submitted', {
          feedback: 'negative',
          text: 'This response was not helpful',
          request_id: null,
        });
      });
    });

    it('does not show feedback buttons when there are no assistant messages', function () {
      const userOnlyMessages: AssistantMessage[] = [
        {
          id: 'user1',
          role: 'user',
          parts: [{ type: 'text', text: 'Hello!' }],
        },
        {
          id: 'user2',
          role: 'user',
          parts: [{ type: 'text', text: 'How are you?' }],
        },
      ];

      renderWithChat(userOnlyMessages);

      // Should not find any feedback buttons in the entire component
      expect(screen.queryByLabelText('Thumbs Up Icon')).to.not.exist;
      expect(screen.queryByLabelText('Thumbs Down Icon')).to.not.exist;
    });
  });
});
