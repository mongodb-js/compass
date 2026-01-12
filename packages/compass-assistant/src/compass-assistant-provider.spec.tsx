import React from 'react';
import {
  render,
  renderHook,
  screen,
  userEvent,
  waitFor,
  within,
} from '@mongodb-js/testing-library-compass';
import {
  CompassAssistantProvider,
  createDefaultChat,
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
import { createBrokenTransport, createMockChat } from '../test/utils';
import {
  ToolsControllerProvider,
  type AtlasAiService,
  type ToolsController,
} from '@mongodb-js/compass-generative-ai/provider';
import type { TrackFunction } from '@mongodb-js/compass-telemetry';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import type { ActiveConnectionInfo } from './assistant-global-state';
import {
  AssistantGlobalStateProvider,
  useSyncAssistantGlobalState,
} from './assistant-global-state';
import type {
  CollectionSubtab,
  WorkspaceTab,
} from '@mongodb-js/workspace-info';
import type { CollectionMetadata } from 'mongodb-collection-model';

function createMockProvider({
  mockAtlasService,
  mockAtlasAiService,
  mockAtlasAuthService,
  mockToolsController,
}: {
  mockAtlasService?: any;
  mockAtlasAiService?: any;
  mockAtlasAuthService?: any;
  mockToolsController?: any;
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

  if (!mockToolsController) {
    mockToolsController = {
      setActiveTools: sinon.stub(),
      getActiveTools: sinon.stub(),
      setContext: sinon.stub(),
      startServer: sinon.stub().resolves(),
      stopServer: sinon.stub().resolves(),
      setConnectionIdForToolCall: sinon.stub(),
    };
  }

  return CompassAssistantProvider.withMockServices({
    atlasService: mockAtlasService as unknown as AtlasService,
    atlasAiService: mockAtlasAiService as unknown as AtlasAiService,
    atlasAuthService: mockAtlasAuthService as unknown as AtlasAuthService,
    toolsController: mockToolsController as unknown as ToolsController,
  });
}

// Test component that renders CompassAssistantProvider (and AssistantProvider) with children
const TestComponent: React.FunctionComponent<{
  chat: Chat<AssistantMessage>;
  autoOpen?: boolean;
  mockAtlasService?: any;
  mockAtlasAiService?: any;
  mockAtlasAuthService?: any;
  mockToolsController?: any;
  hasNonGenuineConnections?: boolean;
  currentQuery?: string;
  currentPipeline?: string;
  connections?: ActiveConnectionInfo[];
  activeWorkspace?: WorkspaceTab;
  collectionMetadata?: CollectionMetadata;
  currentTab?: CollectionSubtab;
}> = ({
  chat,
  autoOpen,
  mockAtlasService,
  mockAtlasAiService,
  mockAtlasAuthService,
  mockToolsController,
  hasNonGenuineConnections,
  currentQuery,
  currentPipeline,
  connections,
  activeWorkspace,
  collectionMetadata,
  currentTab,
}) => {
  const MockedProvider = createMockProvider({
    mockAtlasService: mockAtlasService as unknown as AtlasService,
    mockAtlasAiService: mockAtlasAiService as unknown as AtlasAiService,
    mockAtlasAuthService: mockAtlasAuthService as unknown as AtlasAuthService,
    mockToolsController: mockToolsController as unknown as ToolsController,
  });

  const FakeStateSetterComponent = () => {
    useSyncAssistantGlobalState('activeConnections', connections ?? []);
    useSyncAssistantGlobalState('activeWorkspace', activeWorkspace ?? null);
    useSyncAssistantGlobalState(
      'activeCollectionMetadata',
      collectionMetadata ?? null
    );
    useSyncAssistantGlobalState('activeCollectionSubTab', currentTab ?? null);
    useSyncAssistantGlobalState('currentQuery', currentQuery ?? null);
    useSyncAssistantGlobalState('currentPipeline', currentPipeline ?? null);

    return null;
  };

  return (
    <AssistantGlobalStateProvider>
      <DrawerContentProvider>
        <ToolsControllerProvider>
          {/* Breaking this rule is fine while none of the tests try to re-render the content */}
          {/* eslint-disable-next-line react-hooks/static-components */}
          <MockedProvider
            originForPrompt="mongodb-compass"
            appNameForPrompt="MongoDB Compass"
            chat={chat}
          >
            <DrawerAnchor>
              <div data-testid="provider-children">Provider children</div>
              <CompassAssistantDrawer
                appName="Compass"
                autoOpen={autoOpen}
                hasNonGenuineConnections={hasNonGenuineConnections}
              />
            </DrawerAnchor>
            <FakeStateSetterComponent />
          </MockedProvider>
        </ToolsControllerProvider>
      </DrawerContentProvider>
    </AssistantGlobalStateProvider>
  );
};

describe('useAssistantActions', function () {
  const createWrapper = (chat: Chat<AssistantMessage>) => {
    function TestWrapper({ children }: { children: React.ReactNode }) {
      const MockedProvider = createMockProvider();

      return (
        <DrawerContentProvider>
          {/* Breaking this rule is fine while none of the tests try to re-render the content */}
          {/* eslint-disable-next-line react-hooks/static-components */}
          <MockedProvider
            originForPrompt="mongodb-compass"
            appNameForPrompt="MongoDB Compass"
            chat={chat}
          >
            {children}
          </MockedProvider>
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
        enableToolCalling: true,
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
        enableToolCalling: true,
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
        enableToolCalling: true,
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
        enableToolCalling: true,
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
        enableToolCalling: true,
      },
    });

    expect(screen.getByTestId('provider-children')).to.exist;
  });

  describe('disabling the Assistant', function () {
    it('does not render assistant drawer when AI features are disabled via isAIFeatureEnabled', function () {
      render(<TestComponent chat={createMockChat({ messages: [] })} />, {
        preferences: {
          enableAIAssistant: true,
          // These control isAIFeatureEnabled
          enableGenAIFeatures: false,
          enableGenAIFeaturesAtlasOrg: true,
          cloudFeatureRolloutAccess: { GEN_AI_COMPASS: true },
          enableToolCalling: true,
        },
      });

      expect(screen.getByTestId('provider-children')).to.exist;
      // The drawer toolbar button should not exist when AI features are disabled
      expect(screen.queryByLabelText('MongoDB Assistant')).to.not.exist;
    });

    it('does not render assistant drawer when Atlas org AI features are disabled', function () {
      render(<TestComponent chat={createMockChat({ messages: [] })} />, {
        preferences: {
          enableAIAssistant: true,
          enableGenAIFeatures: true,
          enableGenAIFeaturesAtlasOrg: false,
          cloudFeatureRolloutAccess: { GEN_AI_COMPASS: true },
          enableToolCalling: true,
        },
      });

      expect(screen.getByTestId('provider-children')).to.exist;
      // The drawer toolbar button should not exist when Atlas org AI features are disabled
      expect(screen.queryByLabelText('MongoDB Assistant')).to.not.exist;
    });

    it('does not render assistant drawer when cloud feature rollout access is disabled', function () {
      render(<TestComponent chat={createMockChat({ messages: [] })} />, {
        preferences: {
          enableAIAssistant: true,
          enableGenAIFeatures: true,
          enableGenAIFeaturesAtlasOrg: true,
          cloudFeatureRolloutAccess: { GEN_AI_COMPASS: false },
          enableToolCalling: true,
        },
      });

      expect(screen.getByTestId('provider-children')).to.exist;
      // The drawer toolbar button should not exist when cloud feature rollout access is disabled
      expect(screen.queryByLabelText('MongoDB Assistant')).to.not.exist;
    });
  });

  it('renders the assistant drawer as the first drawer item when AI assistant is enabled', function () {
    render(<TestComponent chat={createMockChat({ messages: [] })} />, {
      preferences: {
        enableAIAssistant: true,
        enableGenAIFeatures: true,
        enableGenAIFeaturesAtlasOrg: true,
        cloudFeatureRolloutAccess: { GEN_AI_COMPASS: true },
        enableToolCalling: true,
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

    async function renderOpenAssistantDrawer({
      chat,
      atlastAiService,
      toolsController,
      hasNonGenuineConnections,
      enableToolCalling = true,
      enableGenAIToolCalling = true,
      query,
      pipeline,
      connections,
      activeWorkspace,
      collectionMetadata,
      currentTab,
    }: {
      chat: Chat<AssistantMessage>;
      atlastAiService?: Partial<AtlasAiService>;
      toolsController?: Partial<ToolsController>;
      hasNonGenuineConnections?: boolean;
      enableToolCalling?: boolean;
      enableGenAIToolCalling?: boolean;
      query?: string;
      pipeline?: string;
      connections?: ActiveConnectionInfo[];
      activeWorkspace?: WorkspaceTab;
      collectionMetadata?: CollectionMetadata;
      currentTab?: CollectionSubtab;
    }): Promise<ReturnType<typeof render>> {
      const result = render(
        <TestComponent
          chat={chat}
          mockAtlasAiService={atlastAiService}
          mockToolsController={toolsController}
          autoOpen={true}
          hasNonGenuineConnections={hasNonGenuineConnections}
          currentQuery={query}
          currentPipeline={pipeline}
          connections={connections}
          activeWorkspace={activeWorkspace}
          collectionMetadata={collectionMetadata}
          currentTab={currentTab}
        />,
        {
          preferences: {
            enableAIAssistant: true,
            enableGenAIFeatures: true,
            enableGenAIFeaturesAtlasOrg: true,
            cloudFeatureRolloutAccess: { GEN_AI_COMPASS: true },
            enableToolCalling,
            enableGenAIToolCalling,
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

      await renderOpenAssistantDrawer({ chat: mockChat });

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

      await renderOpenAssistantDrawer({ chat: mockChat });

      const input = screen.getByPlaceholderText('Ask a question');
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
            Promise.resolve(
              new ReadableStream({
                start(c) {
                  c.close();
                },
              })
            )
          ),
          reconnectToStream: sinon.stub(),
        },
      });

      const sendMessageSpy = sinon.spy(mockChat, 'sendMessage');

      await renderOpenAssistantDrawer({ chat: mockChat });

      for (let i = 0; i < 2; i++) {
        userEvent.type(
          screen.getByPlaceholderText('Ask a question'),
          `Hello assistant! (${i})`
        );
        userEvent.click(screen.getByLabelText('Send message'));

        await waitFor(() => {
          expect(sendMessageSpy.callCount).to.equal(i + 1);
          expect(sendMessageSpy.getCall(i).args[0]).to.deep.include({
            text: `Hello assistant! (${i})`,
          });

          expect(screen.getByText(`Hello assistant! (${i})`)).to.exist;
        });
      }

      let contextMessages = mockChat.messages.filter(
        (message) => message.metadata?.isSystemContext
      );

      for (const contextMessage of contextMessages) {
        // just clear it up so we can deep compare
        contextMessage.id = 'system-context';
      }

      // it only sent one
      expect(contextMessages).to.deep.equal([
        {
          id: 'system-context',
          role: 'system',
          metadata: {
            isSystemContext: true,
          },
          parts: [
            {
              type: 'text',
              text: "The user does not have any tabs open.\n\n<abilities>\nYou CAN:\n1. Access user database information, such as collection schemas, etc.\n2. Query MongoDB directly.\n3. Access the user's current query or aggregation pipeline.\n</abilities>",
            },
          ],
        },
      ]);

      // if we clear the chat it will send the context again next time
      sendMessageSpy.resetHistory();
      mockChat.messages = [];

      userEvent.type(
        screen.getByPlaceholderText('Ask a question'),
        'How about now?'
      );
      userEvent.click(screen.getByLabelText('Send message'));

      await waitFor(() => {
        expect(sendMessageSpy.callCount).to.equal(1);
        expect(sendMessageSpy.getCall(0).args[0]).to.deep.include({
          text: 'How about now?',
        });

        expect(screen.getByText('How about now?')).to.exist;
      });

      contextMessages = mockChat.messages.filter(
        (message) => message.metadata?.isSystemContext
      );
      expect(contextMessages).to.have.lengthOf(1);
    });

    it('will not send new messages if the user does not opt in', async function () {
      const chat = new Chat<AssistantMessage>({
        messages: [
          {
            id: 'assistant',
            role: 'assistant',
            parts: [{ type: 'text', text: 'Hello user!' }],
          },
        ],
        transport: {
          sendMessages: sinon.stub().returns(
            Promise.resolve(
              new ReadableStream({
                start(c) {
                  c.close();
                },
              })
            )
          ),
          reconnectToStream: sinon.stub(),
        },
      });

      const atlastAiService = {
        ensureAiFeatureAccess: sinon.stub().rejects(),
      };

      const sendMessageSpy = sinon.spy(chat, 'sendMessage');

      await renderOpenAssistantDrawer({ chat, atlastAiService });

      userEvent.type(
        screen.getByPlaceholderText('Ask a question'),
        'Hello assistant!'
      );
      userEvent.click(screen.getByLabelText('Send message'));

      await waitFor(() => {
        expect(atlastAiService.ensureAiFeatureAccess.calledOnce).to.be.true;
        expect(sendMessageSpy.called).to.be.false;
      });
      expect(screen.queryByText('Hello assistant!')).to.not.exist;
    });

    it('disables tools if toolCalling feature is disabled', async function () {
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

      const mockToolsController = {
        setActiveTools: sinon.stub().resolves(),
        getActiveTools: sinon.stub().resolves({}),
        setContext: sinon.stub().resolves(),
      };

      await renderOpenAssistantDrawer({
        chat: mockChat,
        toolsController: mockToolsController,
        enableToolCalling: false,
        enableGenAIToolCalling: true,
      });

      const input = screen.getByPlaceholderText('Ask a question');
      const sendButton = screen.getByLabelText('Send message');

      userEvent.type(input, 'Hello assistant');
      userEvent.click(sendButton);

      await waitFor(() => {
        expect(sendMessageSpy.calledOnce).to.be.true;
        expect(sendMessageSpy.firstCall.args[0]).to.deep.include({
          text: 'Hello assistant',
        });
      });

      const contextMessages = mockChat.messages.filter(
        (message) => message.metadata?.isSystemContext
      );
      expect(contextMessages).to.have.lengthOf(1);

      expect(mockToolsController.setActiveTools.callCount).to.equal(1);
      expect(
        mockToolsController.setActiveTools.firstCall.args[0]
      ).to.deep.equal(new Set());

      expect(mockToolsController.setContext.callCount).to.equal(1);
      expect(mockToolsController.setContext.firstCall.args[0]).to.deep.equal({
        connections: [],
        query: undefined,
        pipeline: undefined,
      });
    });

    it('disables tools if toolCalling feature is enabled and enableGenAIToolCalling setting is disabled', async function () {
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

      const mockToolsController = {
        setActiveTools: sinon.stub(),
        getActiveTools: sinon.stub(),
        setContext: sinon.stub(),
        startServer: sinon.stub().resolves(),
        stopServer: sinon.stub().resolves(),
        setConnectionIdForToolCall: sinon.stub(),
      };

      const query = 'This is a fake query';
      const pipeline = 'This is a fake aggregation';

      await renderOpenAssistantDrawer({
        chat: mockChat,
        toolsController: mockToolsController,
        enableToolCalling: true,
        enableGenAIToolCalling: false,
        query,
        pipeline,
      });

      const input = screen.getByPlaceholderText('Ask a question');
      const sendButton = screen.getByLabelText('Send message');

      userEvent.type(input, 'Hello assistant');
      userEvent.click(sendButton);

      await waitFor(() => {
        expect(sendMessageSpy.calledOnce).to.be.true;
        expect(sendMessageSpy.firstCall.args[0]).to.deep.include({
          text: 'Hello assistant',
        });
      });

      const contextMessages = mockChat.messages.filter(
        (message) => message.metadata?.isSystemContext
      );
      expect(contextMessages).to.have.lengthOf(1);

      expect(mockToolsController.setActiveTools.callCount).to.equal(1);
      expect(
        mockToolsController.setActiveTools.firstCall.args[0]
      ).to.deep.equal(new Set([]));

      expect(mockToolsController.setContext.callCount).to.equal(1);
      expect(mockToolsController.setContext.firstCall.args[0]).to.deep.equal({
        connections: [],
        query,
        pipeline,
      });
    });

    it('enables tools if toolCalling feature is enabled and enableGenAIToolCalling setting is enabled', async function () {
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

      const mockToolsController = {
        setActiveTools: sinon.stub(),
        getActiveTools: sinon.stub(),
        setContext: sinon.stub(),
        startServer: sinon.stub().resolves(),
        stopServer: sinon.stub().resolves(),
        setConnectionIdForToolCall: sinon.stub(),
      };

      const query = 'This is a fake query';
      const pipeline = 'This is a fake aggregation';

      await renderOpenAssistantDrawer({
        chat: mockChat,
        toolsController: mockToolsController,
        enableToolCalling: true,
        enableGenAIToolCalling: true,
        query,
        pipeline,
        activeWorkspace: {
          id: 'workspace-1',
          type: 'Collection',
          connectionId: 'connection-1',
          namespace: 'foo.foo',
          subTab: 'Aggregations',
        },
        currentTab: 'Aggregations',
      });

      const input = screen.getByPlaceholderText('Ask a question');
      const sendButton = screen.getByLabelText('Send message');

      userEvent.type(input, 'Hello assistant');
      userEvent.click(sendButton);

      await waitFor(() => {
        expect(sendMessageSpy.calledOnce).to.be.true;
        expect(sendMessageSpy.firstCall.args[0]).to.deep.include({
          text: 'Hello assistant',
        });
      });

      const contextMessages = mockChat.messages.filter(
        (message) => message.metadata?.isSystemContext
      );
      expect(contextMessages).to.have.lengthOf(1);

      expect(mockToolsController.setActiveTools.callCount).to.equal(1);
      expect(
        mockToolsController.setActiveTools.firstCall.args[0]
      ).to.deep.equal(new Set(['aggregation-builder']));

      expect(mockToolsController.setContext.callCount).to.equal(1);
      expect(mockToolsController.setContext.firstCall.args[0]).to.deep.equal({
        connections: [],
        query,
        pipeline,
      });
    });

    it('enables database tools if toolCalling feature and enableGenAIToolCalling setting are enabled and there is a focused connection', async function () {
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

      const mockToolsController = {
        setActiveTools: sinon.stub(),
        getActiveTools: sinon.stub(),
        setContext: sinon.stub(),
        startServer: sinon.stub().resolves(),
        stopServer: sinon.stub().resolves(),
        setConnectionIdForToolCall: sinon.stub(),
      };

      const query = 'This is a fake query';
      const pipeline = 'This is a fake aggregation';
      const connections: ActiveConnectionInfo[] = [
        {
          id: 'connection-1',
          connectionOptions: {
            connectionString: 'mongodb://localhost:27017',
          },
          connectOptions: {
            productName: 'test',
            productDocsLink: 'https://example.com/docs',
          },
        },
      ];
      const activeWorkspace: WorkspaceTab = {
        id: 'workspace-1',
        type: 'Databases',
        connectionId: connections[0]?.id,
      };

      await renderOpenAssistantDrawer({
        chat: mockChat,
        toolsController: mockToolsController,
        enableToolCalling: true,
        enableGenAIToolCalling: true,
        query,
        pipeline,
        connections,
        activeWorkspace,
      });

      const input = screen.getByPlaceholderText('Ask a question');
      const sendButton = screen.getByLabelText('Send message');

      userEvent.type(input, 'Hello assistant');
      userEvent.click(sendButton);

      await waitFor(() => {
        expect(sendMessageSpy.calledOnce).to.be.true;
        expect(sendMessageSpy.firstCall.args[0]).to.deep.include({
          text: 'Hello assistant',
        });
      });

      const contextMessages = mockChat.messages.filter(
        (message) => message.metadata?.isSystemContext
      );
      expect(contextMessages).to.have.lengthOf(1);

      expect(mockToolsController.setActiveTools.callCount).to.equal(1);
      expect(
        mockToolsController.setActiveTools.firstCall.args[0]
      ).to.deep.equal(new Set(['db-read']));

      expect(mockToolsController.setContext.callCount).to.equal(1);
      expect(mockToolsController.setContext.firstCall.args[0]).to.deep.equal({
        connections: [
          {
            connectionId: 'connection-1',
            connectionString: 'mongodb://localhost:27017',
            connectOptions: {
              productName: 'test',
              productDocsLink: 'https://example.com/docs',
            },
          },
        ],
        query,
        pipeline,
      });
    });

    describe('error handling with default chat', function () {
      it('fires a telemetry event and displays error banner when error occurs', async function () {
        const track = sinon.stub();
        const chat = createDefaultChat({
          options: {
            transport: createBrokenTransport(),
          },
          originForPrompt: 'mongodb-compass',
          appNameForPrompt: 'MongoDB Compass',
          atlasService: {
            assistantApiEndpoint: sinon
              .stub()
              .returns('https://localhost:3000'),
          } as unknown as AtlasService,
          logger: createNoopLogger(),
          track: track as unknown as TrackFunction,
        });
        await renderOpenAssistantDrawer({
          chat,
        });

        // Send a message
        userEvent.type(
          screen.getByPlaceholderText('Ask a question'),
          'Hello assistant!'
        );
        userEvent.click(screen.getByLabelText('Send message'));

        await waitFor(() => {
          expect(screen.getByText(/Test connection error/)).to.exist;
        });

        expect(track).to.have.been.calledWith('Assistant Response Failed', {
          error_name: 'ConnectionError',
        });
      });
    });

    describe('clear chat button', function () {
      it('is hidden when the chat is empty', async function () {
        const mockChat = createMockChat({ messages: [] });
        await renderOpenAssistantDrawer({ chat: mockChat });
        expect(screen.queryByTestId('assistant-clear-chat')).to.not.exist;
      });

      it('is hidden when the chat has only permanent messages', async function () {
        const mockChat = createMockChat({
          messages: mockMessages.map((message) => ({
            ...message,
            metadata: { isPermanent: true },
          })),
        });
        await renderOpenAssistantDrawer({ chat: mockChat });
        expect(screen.queryByTestId('assistant-clear-chat')).to.not.exist;
      });

      it('is visible when the chat has messages', async function () {
        const mockChat = createMockChat({ messages: mockMessages });
        await renderOpenAssistantDrawer({ chat: mockChat });
        expect(screen.getByTestId('assistant-clear-chat')).to.exist;
      });

      it('appears after a message is sent', async function () {
        const mockChat = new Chat<AssistantMessage>({
          messages: [],
          transport: {
            sendMessages: sinon.stub().returns(
              new Promise(() => {
                return new ReadableStream({});
              })
            ),
            reconnectToStream: sinon.stub(),
          },
        });
        await renderOpenAssistantDrawer({ chat: mockChat });

        expect(screen.queryByTestId('assistant-clear-chat')).to.not.exist;

        userEvent.type(
          screen.getByPlaceholderText('Ask a question'),
          'Hello assistant'
        );
        userEvent.click(screen.getByLabelText('Send message'));

        await waitFor(() => {
          expect(screen.getByTestId('assistant-clear-chat')).to.exist;
        });
      });

      it('clears the chat when the user clicks and confirms', async function () {
        const mockChat = createMockChat({ messages: mockMessages });

        await renderOpenAssistantDrawer({ chat: mockChat });

        const clearButton = screen.getByTestId('assistant-clear-chat');
        userEvent.click(clearButton);

        await waitFor(() => {
          expect(
            screen.getByTestId('assistant-confirm-clear-chat-modal').firstChild
          ).to.exist;
        });

        // There should be messages in the chat
        expect(screen.getByTestId('assistant-message-1')).to.exist;
        expect(screen.getByTestId('assistant-message-2')).to.exist;

        const modal = screen.getByTestId('assistant-confirm-clear-chat-modal');
        const confirmButton = within(modal).getByText('Clear chat');
        userEvent.click(confirmButton);

        await waitFor(() => {
          expect(
            screen.getByTestId('assistant-confirm-clear-chat-modal').firstChild
          ).to.not.exist;
        });

        expect(mockChat.messages).to.be.empty;
        expect(screen.queryByTestId('assistant-message-1')).to.not.exist;
        expect(screen.queryByTestId('assistant-message-2')).to.not.exist;
      });

      it('does not clear the chat when the user clicks the button and cancels', async function () {
        const mockChat = createMockChat({ messages: mockMessages });

        await renderOpenAssistantDrawer({ chat: mockChat });

        const clearButton = screen.getByTestId('assistant-clear-chat');
        userEvent.click(clearButton);

        await waitFor(() => {
          expect(
            screen.getByTestId('assistant-confirm-clear-chat-modal').firstChild
          ).to.exist;
        });

        // There should be messages in the chat
        expect(screen.getByTestId('assistant-message-1')).to.exist;
        expect(screen.getByTestId('assistant-message-2')).to.exist;

        const modal = screen.getByTestId('assistant-confirm-clear-chat-modal');
        const cancelButton = within(modal).getByText('Cancel');
        userEvent.click(cancelButton);

        await waitFor(() => {
          expect(
            screen.getByTestId('assistant-confirm-clear-chat-modal').firstChild
          ).to.not.exist;
        });

        expect(mockChat.messages).to.deep.equal(mockMessages);
        expect(screen.getByTestId('assistant-message-1')).to.exist;
        expect(screen.getByTestId('assistant-message-2')).to.exist;
      });

      it('should persist permanent warning messages when clearing chat', async function () {
        const mockChat = createMockChat({ messages: mockMessages });
        await renderOpenAssistantDrawer({
          chat: mockChat,
          hasNonGenuineConnections: true,
        });

        const clearButton = screen.getByTestId('assistant-clear-chat');
        userEvent.click(clearButton);

        await waitFor(() => {
          expect(
            screen.getByTestId('assistant-confirm-clear-chat-modal').firstChild
          ).to.exist;
        });

        // There should be messages in the chat
        expect(screen.getByTestId('assistant-message-1')).to.exist;
        expect(screen.getByTestId('assistant-message-2')).to.exist;
        expect(screen.getByTestId('assistant-message-non-genuine-warning')).to
          .exist;

        const modal = screen.getByTestId('assistant-confirm-clear-chat-modal');
        const confirmButton = within(modal).getByText('Clear chat');
        userEvent.click(confirmButton);

        await waitFor(() => {
          expect(
            screen.getByTestId('assistant-confirm-clear-chat-modal').firstChild
          ).to.not.exist;
        });

        // The non-genuine warning message should still be in the chat
        expect(screen.getByTestId('assistant-message-non-genuine-warning')).to
          .exist;
        // The user messages should be gone
        expect(screen.queryByTestId('assistant-message-1')).to.not.exist;
        expect(screen.queryByTestId('assistant-message-2')).to.not.exist;
      });
    });
  });

  let sandbox: sinon.SinonSandbox;

  beforeEach(function () {
    sandbox = sinon.createSandbox();
  });

  afterEach(function () {
    if (sandbox) {
      sandbox.reset();
    }
  });

  it('uses the Atlas Service assistantApiEndpoint', async function () {
    const mockAtlasService = {
      assistantApiEndpoint: sandbox
        .stub()
        .returns('https://example.com/assistant/api/v1'),
    };

    const chat = createDefaultChat({
      originForPrompt: 'foo',
      appNameForPrompt: 'bar',
      atlasService: mockAtlasService as unknown as AtlasService,
      logger: createNoopLogger(),
      track: () => undefined,
    });

    const fetchStub = sandbox
      .stub(globalThis, 'fetch')
      .resolves({ ok: true, headers: [] } as any);

    await chat.sendMessage({ text: 'hello' });

    expect(mockAtlasService.assistantApiEndpoint.calledOnce).to.be.true;
    expect(fetchStub.lastCall.args[0]).to.eq(
      'https://example.com/assistant/api/v1/responses'
    );
  });
});
