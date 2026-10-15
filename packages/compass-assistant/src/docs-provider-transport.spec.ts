import { expect } from 'chai';
import sinon from 'sinon';
import {
  DocsProviderTransport,
  shouldExcludeMessage,
} from './docs-provider-transport';
import type { AssistantMessage } from './compass-assistant-provider';
import { MockLanguageModelV3 } from 'ai/test';
import type { UIMessageChunk } from 'ai';
import { waitFor } from '@mongodb-js/testing-library-compass';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe('DocsProviderTransport', function () {
  describe('shouldExcludeMessage', function () {
    it('returns false for messages without confirmation metadata', function () {
      const message: AssistantMessage = {
        id: 'test-1',
        role: 'user',
        parts: [{ type: 'text', text: 'Hello' }],
      };

      expect(shouldExcludeMessage(message)).to.be.false;
    });

    it('returns true for confirmation messages', function () {
      const message: AssistantMessage = {
        id: 'test-5',
        role: 'assistant',
        parts: [{ type: 'text', text: 'Response' }],
        metadata: {
          confirmation: {
            state: 'pending',
            description: 'Confirm this action',
          },
        },
      };

      expect(shouldExcludeMessage(message)).to.be.true;
    });
  });

  describe('sending messages', function () {
    let mockModel: MockLanguageModelV3;
    let doStream: sinon.SinonStub;
    let transport: DocsProviderTransport;
    let abortController: AbortController;
    let threadId: string;
    let sendMessages: (
      params: Partial<Parameters<typeof transport.sendMessages>[0]>
    ) => Promise<ReadableStream<UIMessageChunk>>;

    beforeEach(function () {
      // Mock the OpenAI client
      doStream = sinon.stub().returns({
        stream: DocsProviderTransport.emptyStream,
        request: {
          body: {
            messages: [],
          },
        },
      });
      mockModel = new MockLanguageModelV3({
        doStream,
      });
      abortController = new AbortController();
      threadId = '5f8c4a1e-3b7d-4c2a-9e61-0d2b7a9c1f34';
      transport = new DocsProviderTransport({
        origin: 'mongodb-compass',
        instructions: 'Test instructions for MongoDB assistance',
        model: mockModel,
        getThreadId: () => threadId,
      });
      sendMessages = (params) =>
        transport.sendMessages({
          trigger: 'submit-message',
          chatId: 'test-chat',
          messageId: undefined,
          abortSignal: abortController.signal,
          messages: [],
          ...params,
        });
    });

    afterEach(function () {
      sinon.restore();
    });

    describe('sendMessages', function () {
      const userMessage: AssistantMessage = {
        id: 'included1',
        role: 'user',
        parts: [{ type: 'text', text: 'User message' }],
      };
      const confirmationPendingMessage: AssistantMessage = {
        id: 'test',
        role: 'assistant',
        parts: [{ type: 'text', text: 'Response' }],
        metadata: {
          confirmation: {
            state: 'pending',
            description: 'Confirm this action',
          },
        },
      };
      const confirmationConfirmedMessage: AssistantMessage = {
        id: 'test',
        role: 'assistant',
        parts: [{ type: 'text', text: 'Response' }],
        metadata: {
          confirmation: {
            state: 'confirmed',
            description: 'Confirmed action',
          },
        },
      };
      it('returns empty stream when last message should be excluded', async function () {
        const messages: AssistantMessage[] = [
          userMessage,
          confirmationConfirmedMessage,
        ];

        const result = await sendMessages({
          messages,
        });

        expect(result).to.equal(DocsProviderTransport.emptyStream);
        expect(mockModel.doStreamCalls).to.be.empty;
      });

      it('returns empty stream when all messages are filtered out', async function () {
        const messages: AssistantMessage[] = [
          confirmationPendingMessage,
          confirmationConfirmedMessage,
        ];

        const result = await sendMessages({
          messages,
        });

        expect(result).to.equal(DocsProviderTransport.emptyStream);
        expect(mockModel.doStreamCalls).to.be.empty;
      });

      it('sends filtered messages to AI when valid messages exist', async function () {
        await sendMessages({
          messages: [userMessage],
        });

        await waitFor(() => {
          expect(doStream).to.have.been.calledOnce;
          expect(doStream.firstCall.args[0]).to.deep.include({
            prompt: [
              {
                role: 'user',
                providerOptions: undefined,
                content: [
                  {
                    type: 'text',
                    text: 'User message',
                    providerOptions: undefined,
                  },
                ],
              },
            ],
          });
        });
      });

      it('sends only valid messages when confirmation required messages exist', async function () {
        await sendMessages({
          messages: [
            confirmationConfirmedMessage,
            confirmationPendingMessage,
            userMessage,
          ],
        });

        await waitFor(() => {
          expect(doStream).to.have.been.calledOnce;
          expect(doStream.firstCall.args[0]).to.deep.include({
            prompt: [
              {
                role: 'user',
                providerOptions: undefined,
                content: [
                  {
                    type: 'text',
                    text: 'User message',
                    providerOptions: undefined,
                  },
                ],
              },
            ],
          });
        });
      });

      it('sends message with correct request data - with storage enabled', async function () {
        const messages: AssistantMessage[] = [
          {
            id: 'included1',
            role: 'user',
            parts: [{ type: 'text', text: 'User message' }],
            metadata: {
              analyticsId: 'test-user-id',
              requestId: 'test-request-id',
              disableStorage: false,
            },
          },
        ];

        await sendMessages({
          messages,
        });

        await waitFor(() => {
          expect(doStream).to.have.been.calledOnce;
          const callArgs = doStream.firstCall.args[0];
          expect(callArgs.headers).to.deep.include({
            'X-Client-Request-Id': 'test-request-id',
          });
          expect(callArgs.headers['X-Client-Thread-Id']).to.match(UUID_REGEX);
          expect(callArgs.providerOptions.openai).to.deep.include({
            store: false, // always false
            metadata: {
              analytics_id: 'test-user-id',
              sensitive_storage: 'true',
            },
          });
        });
      });

      it('sends message with correct request data - with storage disabled', async function () {
        const messages: AssistantMessage[] = [
          {
            id: 'included1',
            role: 'user',
            parts: [{ type: 'text', text: 'User message' }],
            metadata: {
              analyticsId: 'test-user-id',
              requestId: 'test-request-id',
              disableStorage: true,
            },
          },
        ];

        await sendMessages({
          messages,
        });

        await waitFor(() => {
          expect(doStream).to.have.been.calledOnce;
          const callArgs = doStream.firstCall.args[0];
          expect(callArgs.headers).to.deep.include({
            'X-Client-Request-Id': 'test-request-id',
          });
          expect(callArgs.providerOptions.openai).to.deep.include({
            store: false,
            metadata: {
              analytics_id: 'test-user-id',
              sensitive_storage: 'false',
            },
          });
        });
      });
    });

    describe('X-Client-Thread-Id header', function () {
      const messages: AssistantMessage[] = [
        { id: 'm1', role: 'user', parts: [{ type: 'text', text: 'Hi' }] },
      ];

      async function sentThreadId() {
        const callCount = doStream.callCount;
        await sendMessages({ messages });
        await waitFor(() => {
          expect(doStream.callCount).to.equal(callCount + 1);
        });
        return doStream.lastCall.args[0].headers['X-Client-Thread-Id'];
      }

      it('sends the thread id provided by getThreadId', async function () {
        expect(await sentThreadId()).to.equal(threadId);
      });

      it('follows the thread id when it changes', async function () {
        await sentThreadId();
        threadId = 'a1b2c3d4-0000-4000-8000-123456789abc';
        expect(await sentThreadId()).to.equal(threadId);
      });
    });

    // We currently do not support reconnecting to streams but we may want to in the future
    describe('reconnectToStream', function () {
      it('always returns null', async function () {
        const result = await transport.reconnectToStream();
        expect(result).to.be.null;
      });
    });
  });
});
