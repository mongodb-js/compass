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
      transport = new DocsProviderTransport({
        origin: 'mongodb-compass',
        instructions: 'Test instructions for MongoDB assistance',
        model: mockModel,
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
