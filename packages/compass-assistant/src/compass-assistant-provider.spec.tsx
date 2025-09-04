import React from 'react';
import {
  render,
  renderHook,
  screen,
  userEvent,
  waitFor,
  waitForElementToBeRemoved,
  within,
} from '@mongodb-js/testing-library-compass';
import {
  CompassAssistantProvider,
  useAssistantActions,
  type AssistantMessage,
} from './compass-assistant-provider';
import { expect } from 'chai';
import sinon from 'sinon';
import { Chat } from './@ai-sdk/react/chat-react';

import {
  DrawerAnchor,
  DrawerContentProvider,
} from '@mongodb-js/compass-components';
import type { AtlasAuthService } from '@mongodb-js/atlas-service/provider';
import type { AtlasService } from '@mongodb-js/atlas-service/provider';
import { CompassAssistantDrawer } from './compass-assistant-drawer';
import { createMockChat } from '../test/utils';
import { type AtlasAiService } from '@mongodb-js/compass-generative-ai/provider';

function createMockProvider({
  mockAtlasService,
  mockAtlasAiService,
  mockAtlasAuthService,
}: {
  mockAtlasService?: any;
  mockAtlasAiService?: any;
  mockAtlasAuthService?: any;
} = {}) {
  if (!mockAtlasService) {
    mockAtlasService = {
      assistantApiEndpoint: sinon
        .stub()
        .returns('https://example.com/assistant/api/v1'),
    };
  }

  if (!mockAtlasAiService) {
    mockAtlasAiService = {
      ensureAiFeatureAccess: sinon.stub().resolves(),
    };
  }

  if (!mockAtlasAuthService) {
    mockAtlasAuthService = {};
  }

  return CompassAssistantProvider.withMockServices({
    atlasService: mockAtlasService as unknown as AtlasService,
    atlasAiService: mockAtlasAiService as unknown as AtlasAiService,
    atlasAuthService: mockAtlasAuthService as unknown as AtlasAuthService,
  });
}

// Test component that renders CompassAssistantProvider (and AssistantProvider) with children
const TestComponent: React.FunctionComponent<{
  chat: Chat<AssistantMessage>;
  autoOpen?: boolean;
  mockAtlasService?: any;
  mockAtlasAiService?: any;
  mockAtlasAuthService?: any;
}> = ({
  chat,
  autoOpen,
  mockAtlasService,
  mockAtlasAiService,
  mockAtlasAuthService,
}) => {
  const MockedProvider = createMockProvider({
    mockAtlasService: mockAtlasService as unknown as AtlasService,
    mockAtlasAiService: mockAtlasAiService as unknown as AtlasAiService,
    mockAtlasAuthService: mockAtlasAuthService as unknown as AtlasAuthService,
  });

  return (
    <DrawerContentProvider>
      <MockedProvider chat={chat}>
        <DrawerAnchor>
          <div data-testid="provider-children">Provider children</div>
          <CompassAssistantDrawer autoOpen={autoOpen} />
        </DrawerAnchor>
      </MockedProvider>
    </DrawerContentProvider>
  );
};

describe('useAssistantActions', function () {
  const createWrapper = (chat: Chat<AssistantMessage>) => {
    function TestWrapper({ children }: { children: React.ReactNode }) {
      const MockedProvider = createMockProvider();

      return (
        <DrawerContentProvider>
          <MockedProvider chat={chat}>{children}</MockedProvider>
        </DrawerContentProvider>
      );
    }
    return TestWrapper;
  };

  it('returns mostly empty object when AI features are disabled via isAIFeatureEnabled', function () {
    const { result } = renderHook(() => useAssistantActions(), {
      wrapper: createWrapper(createMockChat({ messages: [] })),
      preferences: {
        enableAIAssistant: true,
        // These control isAIFeatureEnabled
        enableGenAIFeatures: false,
        enableGenAIFeaturesAtlasOrg: true,
        cloudFeatureRolloutAccess: { GEN_AI_COMPASS: true },
      },
    });

    expect(result.current).to.have.keys(['getIsAssistantEnabled']);
  });

  it('returns mostly empty object when enableGenAIFeaturesAtlasOrg is disabled', function () {
    const { result } = renderHook(() => useAssistantActions(), {
      wrapper: createWrapper(createMockChat({ messages: [] })),
      preferences: {
        enableAIAssistant: true,
        enableGenAIFeatures: true,
        enableGenAIFeaturesAtlasOrg: false,
        cloudFeatureRolloutAccess: { GEN_AI_COMPASS: true },
      },
    });

    expect(result.current).to.have.keys(['getIsAssistantEnabled']);
  });

  it('returns mostly empty object when cloudFeatureRolloutAccess is disabled', function () {
    const { result } = renderHook(() => useAssistantActions(), {
      wrapper: createWrapper(createMockChat({ messages: [] })),
      preferences: {
        enableAIAssistant: true,
        enableGenAIFeatures: true,
        enableGenAIFeaturesAtlasOrg: true,
        cloudFeatureRolloutAccess: { GEN_AI_COMPASS: false },
      },
    });

    expect(result.current).to.have.keys(['getIsAssistantEnabled']);
  });

  it('returns mostly empty object when enableAIAssistant preference is disabled', function () {
    const { result } = renderHook(() => useAssistantActions(), {
      wrapper: createWrapper(createMockChat({ messages: [] })),
      preferences: {
        enableAIAssistant: false,
        enableGenAIFeatures: true,
        enableGenAIFeaturesAtlasOrg: true,
        cloudFeatureRolloutAccess: { GEN_AI_COMPASS: true },
      },
    });

    expect(result.current).to.have.keys(['getIsAssistantEnabled']);
  });

  it('returns actions when both AI features and assistant flag are enabled', function () {
    const { result } = renderHook(() => useAssistantActions(), {
      wrapper: createWrapper(createMockChat({ messages: [] })),
      preferences: {
        enableAIAssistant: true,
        enableGenAIFeatures: true,
        enableGenAIFeaturesAtlasOrg: true,
        cloudFeatureRolloutAccess: { GEN_AI_COMPASS: true },
      },
    });

    expect(Object.keys(result.current)).to.have.length.greaterThan(0);
    expect(result.current.interpretExplainPlan).to.be.a('function');
    expect(result.current.interpretConnectionError).to.be.a('function');
    expect(result.current.tellMoreAboutInsight).to.be.undefined;
  });

  it('returns actions when both AI features and assistant flag AND enablePerformanceInsightsEntrypoints are enabled', function () {
    const { result } = renderHook(() => useAssistantActions(), {
      wrapper: createWrapper(createMockChat({ messages: [] })),
      preferences: {
        enableAIAssistant: true,
        enablePerformanceInsightsEntrypoints: true,
        enableGenAIFeatures: true,
        enableGenAIFeaturesAtlasOrg: true,
        cloudFeatureRolloutAccess: { GEN_AI_COMPASS: true },
      },
    });

    expect(Object.keys(result.current)).to.have.length.greaterThan(0);
    expect(result.current.interpretExplainPlan).to.be.a('function');
    expect(result.current.interpretConnectionError).to.be.a('function');
    expect(result.current.tellMoreAboutInsight).to.be.a('function');
  });
});

describe('CompassAssistantProvider', function () {
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

  it('always renders children', function () {
    render(<TestComponent chat={createMockChat({ messages: [] })} />, {
      preferences: {
        enableAIAssistant: true,
        enableGenAIFeatures: true,
        enableGenAIFeaturesAtlasOrg: true,
        cloudFeatureRolloutAccess: { GEN_AI_COMPASS: true },
      },
    });

    expect(screen.getByTestId('provider-children')).to.exist;
  });

  it('does not render assistant drawer when AI assistant is disabled', function () {
    render(<TestComponent chat={createMockChat({ messages: [] })} />, {
      preferences: {
        enableAIAssistant: false,
        enableGenAIFeatures: true,
        enableGenAIFeaturesAtlasOrg: true,
        cloudFeatureRolloutAccess: { GEN_AI_COMPASS: true },
      },
    });

    expect(screen.getByTestId('provider-children')).to.exist;
    // The drawer toolbar button should not exist when disabled
    expect(screen.queryByLabelText('MongoDB Assistant')).to.not.exist;
  });

  it('renders the assistant drawer as the first drawer item when AI assistant is enabled', function () {
    render(<TestComponent chat={createMockChat({ messages: [] })} />, {
      preferences: {
        enableAIAssistant: true,
        enableGenAIFeatures: true,
        enableGenAIFeaturesAtlasOrg: true,
        cloudFeatureRolloutAccess: { GEN_AI_COMPASS: true },
      },
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
      mockChat: Chat<AssistantMessage>,
      mockAtlasAiService?: any
    ): Promise<ReturnType<typeof render>> {
      const result = render(
        <TestComponent
          chat={mockChat}
          mockAtlasAiService={mockAtlasAiService}
          autoOpen={true}
        />,
        {
          preferences: {
            enableAIAssistant: true,
            enableGenAIFeatures: true,
            enableGenAIFeaturesAtlasOrg: true,
            cloudFeatureRolloutAccess: { GEN_AI_COMPASS: true },
          },
        }
      );

      await waitFor(() => {
        expect(screen.getByTestId('assistant-chat')).to.exist;
      });

      return result;
    }

    it('displays messages in the chat feed', async function () {
      const mockChat = createMockChat({ messages: mockMessages });

      await renderOpenAssistantDrawer(mockChat);

      // ensureAiFeatureAccess is async
      await waitFor(() => {
        expect(screen.getByTestId('assistant-message-1')).to.exist;
      });

      expect(screen.getByTestId('assistant-message-1')).to.exist;
      expect(screen.getByTestId('assistant-message-1')).to.have.text(
        'Test message'
      );

      expect(screen.getByTestId('assistant-message-2')).to.exist;
      expect(screen.getByTestId('assistant-message-2')).to.contain.text(
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

      const input = screen.getByPlaceholderText(
        'Ask MongoDB Assistant a question'
      );
      const sendButton = screen.getByLabelText('Send message');

      userEvent.type(input, 'Hello assistant');
      userEvent.click(sendButton);

      await waitFor(() => {
        expect(sendMessageSpy.calledOnce).to.be.true;
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
        screen.getByPlaceholderText('Ask MongoDB Assistant a question'),
        'Hello assistant!'
      );
      userEvent.click(screen.getByLabelText('Send message'));

      await waitFor(() => {
        expect(sendMessageSpy.calledOnce).to.be.true;
        expect(sendMessageSpy.firstCall.args[0]).to.deep.include({
          text: 'Hello assistant!',
        });

        expect(screen.getByText('Hello assistant!')).to.exist;
      });
    });

    it('will not send new messages if the user does not opt in', async function () {
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

      const mockAtlasAiService = {
        ensureAiFeatureAccess: sinon.stub().rejects(),
      };

      const sendMessageSpy = sinon.spy(mockChat, 'sendMessage');

      await renderOpenAssistantDrawer(mockChat, mockAtlasAiService);

      userEvent.type(
        screen.getByPlaceholderText('Ask MongoDB Assistant a question'),
        'Hello assistant!'
      );
      userEvent.click(screen.getByLabelText('Send message'));

      await waitFor(() => {
        expect(mockAtlasAiService.ensureAiFeatureAccess.calledOnce).to.be.true;
        expect(sendMessageSpy.called).to.be.false;
      });
      expect(screen.queryByText('Hello assistant!')).to.not.exist;
    });

    describe('clear chat button', function () {
      it('clears the chat when the user clicks and confirms', async function () {
        const mockChat = createMockChat({ messages: mockMessages });

        await renderOpenAssistantDrawer(mockChat);

        const clearButton = screen.getByTestId('assistant-clear-chat');
        userEvent.click(clearButton);

        await waitFor(() => {
          expect(screen.getByTestId('assistant-confirm-clear-chat-modal')).to
            .exist;
        });

        // There should be messages in the chat
        expect(screen.getByTestId('assistant-message-1')).to.exist;
        expect(screen.getByTestId('assistant-message-2')).to.exist;

        const modal = screen.getByTestId('assistant-confirm-clear-chat-modal');
        const confirmButton = within(modal).getByText('Clear chat');
        userEvent.click(confirmButton);

        await waitForElementToBeRemoved(() =>
          screen.getByTestId('assistant-confirm-clear-chat-modal')
        );

        expect(mockChat.messages).to.be.empty;
        expect(screen.queryByTestId('assistant-message-1')).to.not.exist;
        expect(screen.queryByTestId('assistant-message-2')).to.not.exist;
      });

      it('does not clear the chat when the user clicks the button and cancels', async function () {
        const mockChat = createMockChat({ messages: mockMessages });

        await renderOpenAssistantDrawer(mockChat);

        const clearButton = screen.getByTestId('assistant-clear-chat');
        userEvent.click(clearButton);

        await waitFor(() => {
          expect(screen.getByTestId('assistant-confirm-clear-chat-modal')).to
            .exist;
        });

        // There should be messages in the chat
        expect(screen.getByTestId('assistant-message-1')).to.exist;
        expect(screen.getByTestId('assistant-message-2')).to.exist;

        const modal = screen.getByTestId('assistant-confirm-clear-chat-modal');
        const cancelButton = within(modal).getByText('Cancel');
        userEvent.click(cancelButton);

        await waitForElementToBeRemoved(() =>
          screen.getByTestId('assistant-confirm-clear-chat-modal')
        );

        expect(mockChat.messages).to.deep.equal(mockMessages);
        expect(screen.getByTestId('assistant-message-1')).to.exist;
        expect(screen.getByTestId('assistant-message-2')).to.exist;
      });
    });
  });

  describe('CompassAssistantProvider', function () {
    it('uses the Atlas Service assistantApiEndpoint', async function () {
      const mockAtlasService = {
        assistantApiEndpoint: sinon
          .stub()
          .returns('https://example.com/assistant/api/v1'),
      };

      const mockAtlasAiService = {
        ensureAiFeatureAccess: sinon.stub().callsFake(() => {
          return Promise.resolve();
        }),
      };

      const mockAtlasAuthService = {};

      const MockedProvider = CompassAssistantProvider.withMockServices({
        atlasService: mockAtlasService as unknown as AtlasService,
        atlasAiService: mockAtlasAiService as unknown as AtlasAiService,
        atlasAuthService: mockAtlasAuthService as unknown as AtlasAuthService,
      });

      render(
        <DrawerContentProvider>
          <DrawerAnchor />
          <MockedProvider />
        </DrawerContentProvider>,
        {
          preferences: {
            enableAIAssistant: true,
            enableGenAIFeatures: true,
            enableGenAIFeaturesAtlasOrg: true,
            cloudFeatureRolloutAccess: { GEN_AI_COMPASS: true },
          },
        }
      );

      await waitFor(() => {
        expect(mockAtlasService.assistantApiEndpoint.calledOnce).to.be.true;
      });
    });
  });
});
