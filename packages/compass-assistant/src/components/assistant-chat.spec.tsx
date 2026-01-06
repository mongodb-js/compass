import React from 'react';
import {
  render,
  screen,
  userEvent,
  waitFor,
  within,
} from '@mongodb-js/testing-library-compass';
import { AssistantChat } from './assistant-chat';
import { expect } from 'chai';
import { createBrokenChat, createMockChat } from '../../test/utils';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import {
  AssistantActionsContext,
  type AssistantMessage,
} from '../compass-assistant-provider';
import sinon from 'sinon';
import type { SourceUrlUIPart, TextPart } from 'ai';
import type { Chat } from '../@ai-sdk/react/chat-react';

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
        {
          type: 'source-url',
          title: 'MongoDB',
          url: 'https://en.wikipedia.org/wiki/MongoDB',
          sourceId: '1',
        },
        // this one should be filtered out since it has no url
        {
          type: 'source-url',
          title: 'no url',
          sourceId: '2',
          // url isn't actually required for file_citation
        } as unknown as SourceUrlUIPart,
        // this one should be filtered out since it has no title
        {
          type: 'source-url',
          url: 'no title',
          sourceId: '3',
        },
      ],
      metadata: {
        source: 'performance insights',
      },
    },
  ];

  function renderWithChat(
    chat: Chat<AssistantMessage>,
    {
      connections,
    }: {
      connections?: ConnectionInfo[];
    } = {}
  ) {
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
        <AssistantChat chat={chat} hasNonGenuineConnections={false} />
      </AssistantActionsContext.Provider>,
      {
        connections,
      }
    );
    return {
      result,
      chat,
      ensureOptInAndSendStub,
    };
  }

  it('renders input field and send button', function () {
    renderWithChat(createMockChat({ messages: [] }));

    const inputField = screen.getByPlaceholderText('Ask a question');
    const sendButton = screen.getByLabelText('Send message');

    expect(inputField).to.exist;
    expect(sendButton).to.exist;
  });

  it('input field accepts text input', function () {
    renderWithChat(createMockChat({ messages: [] }));

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const inputField = screen.getByPlaceholderText(
      'Ask a question'
    ) as HTMLTextAreaElement;

    userEvent.type(inputField, 'What is MongoDB?');

    expect(inputField.value).to.equal('What is MongoDB?');
  });

  it('displays the disclaimer and welcome text', function () {
    renderWithChat(createMockChat({ messages: [] }));
    expect(screen.getByText(/Review answers for accuracy/)).to.exist;
  });

  it('displays the welcome text when there are no messages', function () {
    renderWithChat(createMockChat({ messages: [] }));
    expect(screen.getByText(/Welcome to the MongoDB Assistant!/)).to.exist;
  });

  it('does not display the welcome text when there are messages', function () {
    renderWithChat(createMockChat({ messages: mockMessages }));
    expect(screen.queryByText(/Welcome to the MongoDB Assistant!/)).to.not
      .exist;
  });

  it('displays loading state when chat status is submitted', function () {
    renderWithChat(createMockChat({ messages: [], status: 'submitted' }));
    expect(screen.getByText(/MongoDB Assistant is thinking/)).to.exist;
  });

  it('does not display loading in all other cases', function () {
    renderWithChat(
      createMockChat({ messages: mockMessages, status: 'streaming' })
    );
    expect(screen.queryByText(/MongoDB Assistant is thinking/)).to.not.exist;
  });

  it('send button is disabled when input is empty', function () {
    renderWithChat(createMockChat({ messages: [] }));

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const sendButton = screen.getByLabelText(
      'Send message'
    ) as HTMLButtonElement;

    expect(sendButton.getAttribute('aria-disabled')).to.equal('true');
  });

  it('send button is enabled when input has text', function () {
    renderWithChat(createMockChat({ messages: [] }));

    const inputField = screen.getByPlaceholderText('Ask a question');
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const sendButton = screen.getByLabelText(
      'Send message'
    ) as HTMLButtonElement;

    userEvent.type(inputField, 'What is MongoDB?');

    expect(sendButton.disabled).to.be.false;
  });

  it('send button is disabled for whitespace-only input', async function () {
    renderWithChat(createMockChat({ messages: [] }));

    const inputField = screen.getByPlaceholderText('Ask a question');
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
    renderWithChat(createMockChat({ messages: mockMessages }));

    expect(screen.getByTestId('assistant-message-user')).to.exist;
    expect(screen.getByTestId('assistant-message-assistant')).to.exist;
    expect(screen.getByTestId('assistant-message-user')).to.contain.text(
      'Hello, MongoDB Assistant!'
    );
    expect(screen.getByTestId('assistant-message-assistant')).to.contain.text(
      'Hello! How can I help you with MongoDB today?'
    );
  });

  describe('non-genuine MongoDB host handling', function () {
    it('shows warning message in chat when connected to non-genuine MongoDB', function () {
      const chat = createMockChat({ messages: [] });
      render(<AssistantChat chat={chat} hasNonGenuineConnections={true} />);

      expect(chat.messages).to.have.length(1);
      expect(chat.messages[0].id).to.equal('non-genuine-warning');

      const warningMessage = screen.getByText(
        /MongoDB Assistant will not provide accurate guidance for non-genuine hosts/
      );
      expect(warningMessage).to.exist;
    });

    it('does not show warning message when all connections are genuine', function () {
      const chat = createMockChat({ messages: [] });
      render(<AssistantChat chat={chat} hasNonGenuineConnections={false} />, {
        connections: [],
      });

      const warningMessage = screen.queryByText(
        /MongoDB Assistant will not provide accurate guidance for non-genuine hosts/
      );
      expect(warningMessage).to.not.exist;
    });

    it('warning message is removed when all active connections are changed to genuine', async function () {
      const chat = createMockChat({ messages: [] });
      const { rerender } = render(
        <AssistantChat chat={chat} hasNonGenuineConnections={true} />,
        {}
      );

      expect(
        screen.getByText(
          /MongoDB Assistant will not provide accurate guidance for non-genuine hosts/
        )
      ).to.exist;

      rerender(<AssistantChat chat={chat} hasNonGenuineConnections={false} />);

      await waitFor(() => {
        const warningMessage = screen.queryByText(
          /MongoDB Assistant will not provide accurate guidance for non-genuine hosts/
        );
        expect(warningMessage).to.not.exist;
      });
    });
  });

  it('calls sendMessage when form is submitted', async function () {
    const { result, ensureOptInAndSendStub } = renderWithChat(
      createMockChat({ messages: [] })
    );
    const { track } = result;
    const inputField = screen.getByPlaceholderText('Ask a question');
    const sendButton = screen.getByLabelText('Send message');

    userEvent.type(inputField, 'What is aggregation?');
    userEvent.click(sendButton);

    await waitFor(() => {
      expect(ensureOptInAndSendStub.called).to.be.true;
      expect(track).to.have.been.calledWith('Assistant Prompt Submitted', {
        user_input_length: 'What is aggregation?'.length,
      });
    });
  });

  it('clears input field after successful submission', function () {
    renderWithChat(createMockChat({ messages: [] }));

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const inputField = screen.getByPlaceholderText(
      'Ask a question'
    ) as HTMLTextAreaElement;

    userEvent.type(inputField, 'Test message');
    expect(inputField.value).to.equal('Test message');

    userEvent.click(screen.getByLabelText('Send message'));
    expect(inputField.value).to.equal('');
  });

  it('trims whitespace from input before sending', async function () {
    const { ensureOptInAndSendStub, result } = renderWithChat(
      createMockChat({ messages: [] })
    );
    const { track } = result;

    const inputField = screen.getByPlaceholderText('Ask a question');

    userEvent.type(inputField, '  What is sharding?  ');
    userEvent.click(screen.getByLabelText('Send message'));

    await waitFor(() => {
      expect(ensureOptInAndSendStub.called).to.be.true;
      expect(track).to.have.been.calledWith('Assistant Prompt Submitted', {
        user_input_length: 'What is sharding?'.length,
      });
    });
  });

  it('does not call ensureOptInAndSend when input is empty or whitespace-only', function () {
    const { ensureOptInAndSendStub } = renderWithChat(
      createMockChat({ messages: [] })
    );

    const inputField = screen.getByPlaceholderText('Ask a question');
    const chatForm = screen.getByTestId('assistant-chat-input');

    // Test empty input
    userEvent.click(chatForm);
    expect(ensureOptInAndSendStub.notCalled).to.be.true;

    // Test whitespace-only input
    userEvent.type(inputField, '   ');
    userEvent.click(chatForm);
    expect(ensureOptInAndSendStub.notCalled).to.be.true;
  });

  describe('sending and stopping', function () {
    it('can click the stop button after submission', async function () {
      const chat = createMockChat({ messages: [], status: 'submitted' });
      const stopSpy = sinon.spy(chat, 'stop');

      renderWithChat(chat);

      const stopButton = screen.getByLabelText('Stop message');
      userEvent.click(stopButton);

      await waitFor(() => {
        expect(stopSpy).to.have.been.calledOnce;
      });
    });
  });

  it('displays user and assistant messages with different styling', function () {
    renderWithChat(createMockChat({ messages: mockMessages }));

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

    renderWithChat(createMockChat({ messages: messagesWithMultipleParts }));

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

    renderWithChat(createMockChat({ messages: messagesWithMixedParts }));

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

    renderWithChat(createMockChat({ messages: messagesWithDisplayText }));

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
      renderWithChat(createMockChat({ messages: mockMessages }));

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
      const { result } = renderWithChat(
        createMockChat({ messages: mockMessages })
      );
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
          source: 'performance insights',
        });
      });
    });

    it('tracks negative feedback when thumbs down is clicked', async function () {
      const { result } = renderWithChat(
        createMockChat({ messages: mockMessages })
      );
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
          source: 'performance insights',
        });
      });
    });

    it('tracks detailed feedback when feedback text is submitted', async function () {
      const { result } = renderWithChat(
        createMockChat({ messages: mockMessages })
      );
      const { track } = result;

      const assistantMessage = screen.getByTestId(
        'assistant-message-assistant'
      );

      // First click thumbs down to potentially open feedback form
      const thumbsDownButton = within(assistantMessage).getByLabelText(
        'Dislike this message'
      );

      userEvent.click(thumbsDownButton);

      // Look for feedback text area (the exact implementation depends on LeafyGreen)
      const feedbackTextArea = within(assistantMessage).getByRole('textbox');

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
          source: 'performance insights',
        });

        expect(track).to.have.been.calledWith('Assistant Feedback Submitted', {
          feedback: 'negative',
          text: 'This response was not helpful',
          request_id: null,
          source: 'performance insights',
        });
      });
    });

    it('tracks it as "chat response" when source is not present', async function () {
      const { result } = renderWithChat(
        createMockChat({
          messages: [
            {
              ...mockMessages[1],
              metadata: {
                ...mockMessages[1].metadata,
                source: undefined,
              },
            },
          ],
        })
      );
      const { track } = result;

      const thumbsDownButton = within(
        screen.getByTestId('assistant-message-assistant')
      ).getByLabelText('Dislike this message');

      userEvent.click(thumbsDownButton);

      await waitFor(() => {
        expect(track).to.have.been.calledWith('Assistant Feedback Submitted', {
          feedback: 'negative',
          text: undefined,
          request_id: null,
          source: 'chat response',
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

      renderWithChat(createMockChat({ messages: userOnlyMessages }));

      // Should not find any feedback buttons in the entire component
      expect(screen.queryByLabelText('Thumbs Up Icon')).to.not.exist;
      expect(screen.queryByLabelText('Thumbs Down Icon')).to.not.exist;
    });
  });

  describe('messages with confirmation', function () {
    let mockConfirmationMessage: AssistantMessage;

    beforeEach(function () {
      mockConfirmationMessage = {
        id: 'confirmation-test',
        role: 'assistant',
        parts: [{ type: 'text', text: 'This is a confirmation message.' }],
        metadata: {
          confirmation: {
            state: 'pending',
            description: 'Are you sure you want to proceed with this action?',
          },
          source: 'performance insights',
        },
      };
    });

    it('renders confirmation message when message has confirmation metadata', function () {
      renderWithChat(createMockChat({ messages: [mockConfirmationMessage] }));

      expect(screen.getByText('Please confirm your request')).to.exist;
      expect(
        screen.getByText('Are you sure you want to proceed with this action?')
      ).to.exist;
      expect(screen.getByText('Confirm')).to.exist;
      expect(screen.getByText('Cancel')).to.exist;
    });

    it('does not render regular message content when confirmation metadata exists', function () {
      renderWithChat(createMockChat({ messages: [mockConfirmationMessage] }));

      // Should not show the message text content when confirmation is present
      expect(screen.queryByText('This is a confirmation message.')).to.not
        .exist;
    });

    it('shows confirmation as pending when it is the last message', function () {
      renderWithChat(createMockChat({ messages: [mockConfirmationMessage] }));

      expect(screen.getByText('Confirm')).to.exist;
      expect(screen.getByText('Cancel')).to.exist;
      expect(screen.queryByText('Request confirmed')).to.not.exist;
      expect(screen.queryByText('Request cancelled')).to.not.exist;
    });

    it('shows confirmation as rejected when it is not the last message', function () {
      const messages: AssistantMessage[] = [
        mockConfirmationMessage,
        {
          id: 'newer-message',
          role: 'user' as const,
          parts: [{ type: 'text', text: 'Another message' }],
        },
      ];

      renderWithChat(createMockChat({ messages: messages }));

      // The confirmation message (first one) should show as rejected since it's not the last
      expect(screen.queryByText('Confirm')).to.not.exist;
      expect(screen.queryByText('Cancel')).to.not.exist;
      expect(screen.getByText('Request cancelled')).to.exist;
    });

    it('adds new confirmed message when confirmation is confirmed', function () {
      const { chat, ensureOptInAndSendStub } = renderWithChat(
        createMockChat({ messages: [mockConfirmationMessage] })
      );

      const confirmButton = screen.getByText('Confirm');
      userEvent.click(confirmButton);

      // Should add a new message without confirmation metadata
      expect(chat.messages).to.have.length(2);
      const newMessage = chat.messages[1];
      expect(newMessage.id).to.equal('confirmation-test-confirmed');
      expect(newMessage.metadata?.confirmation).to.be.undefined;
      expect(newMessage.parts).to.deep.equal(mockConfirmationMessage.parts);

      // Should call ensureOptInAndSend to send the new message
      expect(ensureOptInAndSendStub.calledOnce).to.be.true;
    });

    it('updates confirmation state to confirmed and adds a new message when confirm button is clicked', function () {
      const { chat } = renderWithChat(
        createMockChat({ messages: [mockConfirmationMessage] })
      );

      const confirmButton = screen.getByText('Confirm');
      userEvent.click(confirmButton);

      // Original message should have updated confirmation state
      const originalMessage = chat.messages[0];
      expect(originalMessage.metadata?.confirmation?.state).to.equal(
        'confirmed'
      );

      expect(chat.messages).to.have.length(2);

      expect(
        screen.getByText((mockConfirmationMessage.parts[0] as TextPart).text)
      ).to.exist;
    });

    it('updates confirmation state to rejected and does not add a new message when cancel button is clicked', function () {
      const { chat, ensureOptInAndSendStub } = renderWithChat(
        createMockChat({ messages: [mockConfirmationMessage] })
      );

      const cancelButton = screen.getByText('Cancel');
      userEvent.click(cancelButton);

      // Original message should have updated confirmation state
      const originalMessage = chat.messages[0];
      expect(originalMessage.metadata?.confirmation?.state).to.equal(
        'rejected'
      );

      // Should not add a new message
      expect(chat.messages).to.have.length(1);

      // Should not call ensureOptInAndSend
      expect(ensureOptInAndSendStub.notCalled).to.be.true;
    });

    it('shows confirmed status after confirmation is confirmed', function () {
      const { chat } = renderWithChat(
        createMockChat({ messages: [mockConfirmationMessage] })
      );

      // Verify buttons are initially present
      expect(screen.getByText('Confirm')).to.exist;
      expect(screen.getByText('Cancel')).to.exist;

      const confirmButton = screen.getByText('Confirm');
      userEvent.click(confirmButton);

      // The state update should be immediate - check the chat messages
      const updatedMessage = chat.messages[0];
      expect(updatedMessage.metadata?.confirmation?.state).to.equal(
        'confirmed'
      );
    });

    it('shows cancelled status after confirmation is rejected', function () {
      const { chat } = renderWithChat(
        createMockChat({ messages: [mockConfirmationMessage] })
      );

      // Verify buttons are initially present
      expect(screen.getByText('Confirm')).to.exist;
      expect(screen.getByText('Cancel')).to.exist;

      const cancelButton = screen.getByText('Cancel');
      userEvent.click(cancelButton);

      // The state update should be immediate - check the chat messages
      const updatedMessage = chat.messages[0];
      expect(updatedMessage.metadata?.confirmation?.state).to.equal('rejected');
    });

    it('handles multiple confirmation messages correctly', function () {
      const confirmationMessage1: AssistantMessage = {
        id: 'confirmation-1',
        role: 'assistant',
        parts: [{ type: 'text', text: 'First confirmation' }],
        metadata: {
          confirmation: {
            state: 'pending',
            description: 'First confirmation description',
          },
        },
      };

      const confirmationMessage2: AssistantMessage = {
        id: 'confirmation-2',
        role: 'assistant',
        parts: [{ type: 'text', text: 'Second confirmation' }],
        metadata: {
          confirmation: {
            state: 'pending',
            description: 'Second confirmation description',
          },
        },
      };

      renderWithChat(
        createMockChat({
          messages: [confirmationMessage1, confirmationMessage2],
        })
      );

      expect(screen.getAllByText('Request cancelled')).to.have.length(1);

      expect(screen.getAllByText('Confirm')).to.have.length(1);
      expect(screen.getAllByText('Cancel')).to.have.length(1);
      expect(screen.getByText('Second confirmation description')).to.exist;
    });

    it('preserves other metadata when creating confirmed message', function () {
      const messageWithExtraMetadata: AssistantMessage = {
        id: 'confirmation-with-metadata',
        role: 'assistant',
        parts: [{ type: 'text', text: 'Message with extra metadata' }],
        metadata: {
          confirmation: {
            state: 'pending',
            description: 'Confirmation description',
          },
          displayText: 'Custom display text',
          isPermanent: true,
        },
      };

      const { chat } = renderWithChat(
        createMockChat({ messages: [messageWithExtraMetadata] })
      );

      const confirmButton = screen.getByText('Confirm');
      userEvent.click(confirmButton);

      // New confirmed message should preserve other metadata
      const newMessage = chat.messages[1];
      expect(newMessage.metadata?.displayText).to.equal('Custom display text');
      expect(newMessage.metadata?.isPermanent).to.equal(true);
      expect(newMessage.metadata?.confirmation).to.be.undefined;
    });

    it('does not render confirmation component for regular messages', function () {
      const regularMessage: AssistantMessage = {
        id: 'regular',
        role: 'assistant',
        parts: [{ type: 'text', text: 'This is a regular message' }],
      };

      renderWithChat(createMockChat({ messages: [regularMessage] }));

      expect(screen.queryByText('Please confirm your request')).to.not.exist;
      expect(screen.queryByText('Confirm')).to.not.exist;
      expect(screen.queryByText('Cancel')).to.not.exist;
      expect(screen.getByText('This is a regular message')).to.exist;
    });

    it('tracks confirmation submitted when confirm button is clicked', async function () {
      const { result } = renderWithChat(
        createMockChat({ messages: [mockConfirmationMessage] })
      );
      const { track } = result;

      const confirmButton = screen.getByText('Confirm');
      userEvent.click(confirmButton);

      await waitFor(() => {
        expect(track).to.have.been.calledWith(
          'Assistant Confirmation Submitted',
          {
            status: 'confirmed',
            source: 'performance insights',
          }
        );
      });
    });

    it('tracks confirmation submitted when cancel button is clicked', async function () {
      const { result } = renderWithChat(
        createMockChat({ messages: [mockConfirmationMessage] })
      );
      const { track } = result;

      const cancelButton = screen.getByText('Cancel');
      userEvent.click(cancelButton);

      await waitFor(() => {
        expect(track).to.have.been.calledWith(
          'Assistant Confirmation Submitted',
          {
            status: 'rejected',
            source: 'performance insights',
          }
        );
      });
    });

    it('tracks it as "chat response" when source is not present', async function () {
      const { result } = renderWithChat(
        createMockChat({
          messages: [
            {
              ...mockConfirmationMessage,
              metadata: {
                ...mockConfirmationMessage.metadata,
                source: undefined,
              },
            },
          ],
        })
      );
      const { track } = result;

      const confirmButton = screen.getByText('Confirm');
      userEvent.click(confirmButton);

      await waitFor(() => {
        expect(track).to.have.been.calledWith(
          'Assistant Confirmation Submitted',
          { status: 'confirmed', source: 'chat response' }
        );
      });
    });
  });

  describe('error handling', function () {
    it('displays error banner when error occurs', async function () {
      renderWithChat(createBrokenChat());

      const inputField = screen.getByPlaceholderText('Ask a question');
      const sendButton = screen.getByLabelText('Send message');

      userEvent.type(inputField, 'What is MongoDB?');
      userEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/Test connection error. Try clearing the chat/))
          .to.exist;
      });
    });

    it('clears error when close button is clicked', async function () {
      const brokenChat = createBrokenChat();
      const clearErrorSpy = sinon.spy(brokenChat, 'clearError');

      renderWithChat(brokenChat);

      const inputField = screen.getByPlaceholderText('Ask a question');
      const sendButton = screen.getByLabelText('Send message');

      userEvent.type(inputField, 'What is MongoDB?');
      userEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/Test connection error. Try clearing the chat/))
          .to.exist;
      });

      const closeButton = screen.getByLabelText('Close Message');
      userEvent.click(closeButton);

      expect(clearErrorSpy).to.have.been.calledOnce;

      await waitFor(() => {
        expect(
          screen.queryByText(/Test connection error. Try clearing the chat/)
        ).to.not.exist;
      });
    });
  });

  describe('related sources', function () {
    it('displays related resources links for assistant messages that include them', async function () {
      renderWithChat(createMockChat({ messages: mockMessages }));
      userEvent.click(screen.getByLabelText('Expand Related Resources'));

      // TODO(COMPASS-9860) can't find the links in test-electron on RHEL and Ubuntu.
      if ((process as any).type === 'renderer') {
        return this.skip();
      }

      await waitFor(() => {
        expect(screen.getByRole('link', { name: 'MongoDB' })).to.have.attribute(
          'href',
          'https://en.wikipedia.org/wiki/MongoDB'
        );
      });
    });

    it('does not display related resources section when there are no source-url parts', function () {
      const messages = mockMessages.map((message) => ({
        ...message,
        parts: message.parts.filter((part) => part.type !== 'source-url'),
      }));
      renderWithChat(createMockChat({ messages: messages }));

      expect(screen.queryByLabelText('Expand Related Resources')).to.not.exist;
    });

    it('displays identical source titles only once', async function () {
      // TODO(COMPASS-9860) can't find the links in test-electron on RHEL and Ubuntu.
      if ((process as any).type === 'renderer') {
        return this.skip();
      }

      const messagesWithDuplicateSources: AssistantMessage[] = [
        {
          id: 'assistant-with-duplicate-sources',
          role: 'assistant',
          parts: [
            {
              type: 'text',
              text: 'Here is information about MongoDB with multiple sources.',
            },
            {
              type: 'source-url',
              title: 'MongoDB Documentation',
              url: 'https://docs.mongodb.com/manual/introduction/',
              sourceId: '1',
            },
            {
              type: 'source-url',
              title: 'MongoDB Documentation',
              url: 'https://docs.mongodb.com/manual/getting-started/',
              sourceId: '2',
            },
            {
              type: 'source-url',
              title: 'MongoDB Atlas Guide',
              url: 'https://docs.atlas.mongodb.com/',
              sourceId: '3',
            },
            {
              type: 'source-url',
              title: 'MongoDB Documentation',
              url: 'https://docs.mongodb.com/manual/tutorial/',
              sourceId: '4',
            },
          ],
        },
      ];

      renderWithChat(
        createMockChat({ messages: messagesWithDuplicateSources })
      );
      userEvent.click(screen.getByLabelText('Expand Related Resources'));

      await waitFor(() => {
        const mongoDbDocLinks = screen.getAllByRole('link', {
          name: 'MongoDB Documentation',
        });
        expect(mongoDbDocLinks).to.have.length(1);

        const atlasGuideLinks = screen.getAllByRole('link', {
          name: 'MongoDB Atlas Guide',
        });
        expect(atlasGuideLinks).to.have.length(1);
      });
    });
  });
});
