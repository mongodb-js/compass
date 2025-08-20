import React from 'react';
import {
  render,
  screen,
  userEvent,
  waitFor,
} from '@mongodb-js/testing-library-compass';
import {
  AssistantProvider,
  CompassAssistantProvider,
  type AssistantMessage,
} from './compass-assistant-provider';
import { expect } from 'chai';
import sinon from 'sinon';
import { Chat } from './@ai-sdk/react/chat-react';

import {
  DrawerAnchor,
  DrawerContentProvider,
} from '@mongodb-js/compass-components';
import type { AtlasService } from '@mongodb-js/atlas-service/provider';
import { CompassAssistantDrawer } from './compass-assistant-drawer';
import { createMockChat } from '../test/utils';

// Test component that renders AssistantProvider with children
const TestComponent: React.FunctionComponent<{
  chat: Chat<AssistantMessage>;
  autoOpen?: boolean;
}> = ({ chat, autoOpen }) => {
  return (
    <DrawerContentProvider>
      <AssistantProvider chat={chat}>
        <DrawerAnchor>
          <div data-testid="provider-children">Provider children</div>
          <CompassAssistantDrawer autoOpen={autoOpen} />
        </DrawerAnchor>
      </AssistantProvider>
    </DrawerContentProvider>
  );
};

describe('AssistantProvider', function () {
  it('always renders children', function () {
    render(<TestComponent chat={createMockChat({ messages: [] })} />, {
      preferences: { enableAIAssistant: true },
    });

    expect(screen.getByTestId('provider-children')).to.exist;
  });

  it('does not render assistant drawer when AI assistant is disabled', function () {
    render(<TestComponent chat={createMockChat({ messages: [] })} />, {
      preferences: { enableAIAssistant: false },
    });

    expect(screen.getByTestId('provider-children')).to.exist;
    // The drawer toolbar button should not exist when disabled
    expect(screen.queryByLabelText('MongoDB Assistant')).to.not.exist;
  });

  it('renders the assistant drawer as the first drawer item when AI assistant is enabled', function () {
    render(<TestComponent chat={createMockChat({ messages: [] })} />, {
      preferences: { enableAIAssistant: true },
    });

    expect(screen.getByTestId('lg-drawer-toolbar-icon_button-0')).to.have.attr(
      'aria-label',
      'MongoDB Assistant'
    );
  });

  describe('with existing chat instance', function () {
    before(function () {
      // TODO(COMPASS-9618): skip in electron runtime for now, drawer has issues rendering
      if ((process as any).type === 'renderer') {
        this.skip();
      }
    });

    async function renderOpenAssistantDrawer(
      mockChat: Chat<AssistantMessage>
    ): Promise<ReturnType<typeof render>> {
      const result = render(<TestComponent chat={mockChat} autoOpen={true} />, {
        preferences: { enableAIAssistant: true },
      });

      await waitFor(() => {
        expect(screen.getByTestId('assistant-chat')).to.exist;
      });

      return result;
    }

    it('displays messages in the chat feed', async function () {
      const mockMessages: AssistantMessage[] = [
        {
          id: '1',
          role: 'user',
          parts: [{ type: 'text', text: 'Test message' }],
        },
        {
          id: '2',
          role: 'assistant',
          parts: [{ type: 'text', text: 'Test assistant message' }],
        },
      ];
      const mockChat = createMockChat({ messages: mockMessages });

      await renderOpenAssistantDrawer(mockChat);

      expect(screen.getByTestId('assistant-message-1')).to.exist;
      expect(screen.getByTestId('assistant-message-1')).to.have.text(
        'Test message'
      );

      expect(screen.getByTestId('assistant-message-2')).to.exist;
      expect(screen.getByTestId('assistant-message-2')).to.have.text(
        'Test assistant message'
      );
    });

    it('handles message sending with custom chat when drawer is open', async function () {
      const mockChat = new Chat<AssistantMessage>({
        messages: [
          {
            id: 'assistant',
            role: 'assistant',
            parts: [{ type: 'text', text: 'Hello user!' }],
          },
        ],
      });

      const sendMessageSpy = sinon.spy(mockChat, 'sendMessage');

      await renderOpenAssistantDrawer(mockChat);

      const input = screen.getByTestId('assistant-chat-input');
      const sendButton = screen.getByTestId('assistant-chat-send-button');

      userEvent.type(input, 'Hello assistant');
      userEvent.click(sendButton);

      expect(sendMessageSpy.calledOnce).to.be.true;
      await waitFor(() => {
        expect(sendMessageSpy.firstCall.args[0]).to.deep.include({
          text: 'Hello assistant',
        });
      });
    });

    it('new messages are added to the chat feed when the send button is clicked', async function () {
      const mockChat = new Chat<AssistantMessage>({
        messages: [
          {
            id: 'assistant',
            role: 'assistant',
            parts: [{ type: 'text', text: 'Hello user!' }],
          },
        ],
        transport: {
          sendMessages: sinon.stub().returns(
            new Promise(() => {
              return new ReadableStream({});
            })
          ),
          reconnectToStream: sinon.stub(),
        },
      });

      const sendMessageSpy = sinon.spy(mockChat, 'sendMessage');

      await renderOpenAssistantDrawer(mockChat);

      userEvent.type(
        screen.getByTestId('assistant-chat-input'),
        'Hello assistant!'
      );
      userEvent.click(screen.getByTestId('assistant-chat-send-button'));

      expect(sendMessageSpy.calledOnce).to.be.true;
      expect(sendMessageSpy.firstCall.args[0]).to.deep.include({
        text: 'Hello assistant!',
      });

      await waitFor(() => {
        expect(screen.getByText('Hello assistant!')).to.exist;
      });
    });
  });

  describe('CompassAssistantProvider', function () {
    beforeEach(function () {
      process.env.COMPASS_ASSISTANT_USE_ATLAS_SERVICE_URL = 'true';
    });

    afterEach(function () {
      delete process.env.COMPASS_ASSISTANT_USE_ATLAS_SERVICE_URL;
    });

    it('uses the Atlas Service assistantApiEndpoint', function () {
      const mockAtlasService = {
        assistantApiEndpoint: sinon
          .stub()
          .returns('https://example.com/assistant/api/v1'),
      };

      const MockedProvider = CompassAssistantProvider.withMockServices({
        atlasService: mockAtlasService as unknown as AtlasService,
      });

      render(
        <DrawerContentProvider>
          <DrawerAnchor />
          <MockedProvider chat={new Chat({})} />
        </DrawerContentProvider>,
        {
          preferences: { enableAIAssistant: true },
        }
      );

      expect(mockAtlasService.assistantApiEndpoint.calledOnce).to.be.true;
    });
  });
});
