import { expect } from 'chai';
import sinon from 'sinon';
import {
  DocsProviderTransport,
  shouldExcludeMessage,
} from './docs-provider-transport';
import type { AssistantMessage } from './compass-assistant-provider';
import { MockLanguageModelV3 } from 'ai/test';
import { jsonSchema, readUIMessageStream, tool, type UIMessageChunk } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
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

    describe('skills', function () {
      // Trimmed version of what the knowledge service streams when it uses skills
      const sseEvent = (data: Record<string, unknown>) =>
        `event: ${String(data.type)}\ndata: ${JSON.stringify(data)}\n\n`;
      const skillCall = (callId: string, skillName: string) => ({
        type: 'function_call',
        id: 'msg_1',
        call_id: callId,
        name: 'skill',
        arguments: JSON.stringify({ skillName }),
      });
      const skillEvents = (callId: string, skillName: string) => [
        sseEvent({
          type: 'response.output_item.added',
          output_index: 0,
          item: { ...skillCall(callId, skillName), status: 'in_progress' },
        }),
        sseEvent({
          type: 'response.output_item.done',
          output_index: 0,
          item: { ...skillCall(callId, skillName), status: 'completed' },
        }),
      ];
      const response = { id: 'resp_1', created_at: 0, model: 'test' };
      const skillsStream = [
        sseEvent({ type: 'response.created', response }),
        ...skillEvents('call_1', 'mongodb-schema-design'),
        ...skillEvents('call_2', 'mongodb-query-optimizer'),
        ...skillEvents('call_3', 'mongodb-schema-design'),
        sseEvent({
          type: 'response.output_item.added',
          output_index: 1,
          item: { type: 'message', id: 'msg_1' },
        }),
        sseEvent({
          type: 'response.output_text.delta',
          item_id: 'msg_1',
          delta: 'Embed comments in posts.',
        }),
        sseEvent({
          type: 'response.output_item.done',
          output_index: 1,
          item: { type: 'message', id: 'msg_1' },
        }),
        sseEvent({
          type: 'response.completed',
          response: {
            ...response,
            usage: { input_tokens: 1, output_tokens: 1 },
          },
        }),
      ].join('');

      const toolCallStream = [
        sseEvent({ type: 'response.created', response }),
        ...skillEvents('call_1', 'mongodb-schema-design'),
        sseEvent({
          type: 'response.output_item.added',
          output_index: 1,
          item: {
            type: 'function_call',
            id: 'msg_1',
            call_id: 'call_2',
            name: 'list-databases',
            arguments: '',
            status: 'in_progress',
          },
        }),
        sseEvent({
          type: 'response.output_item.done',
          output_index: 1,
          item: {
            type: 'function_call',
            id: 'msg_1',
            call_id: 'call_2',
            name: 'list-databases',
            arguments: '{}',
            status: 'completed',
          },
        }),
        sseEvent({
          type: 'response.completed',
          response: {
            ...response,
            usage: { input_tokens: 1, output_tokens: 1 },
          },
        }),
      ].join('');

      const requestBodies: string[] = [];

      beforeEach(function () {
        requestBodies.length = 0;
      });

      async function getUIStream(
        messages: AssistantMessage[],
        stream = skillsStream
      ) {
        const skillsTransport = new DocsProviderTransport({
          origin: 'mongodb-compass',
          instructions: 'Test instructions',
          getTools: () => ({
            'list-databases': tool({
              inputSchema: jsonSchema({ type: 'object' }),
            }),
          }),
          model: createOpenAI({
            apiKey: '',
            baseURL: 'http://example.com',
            fetch: (_url, init) => {
              requestBodies.push(String(init?.body));
              return Promise.resolve(
                new Response(stream, {
                  headers: { 'content-type': 'text/event-stream' },
                })
              );
            },
          }).responses('test-model'),
        });
        const uiStream = await skillsTransport.sendMessages({
          trigger: 'submit-message',
          chatId: 'test-chat',
          messageId: undefined,
          abortSignal: undefined,
          messages,
        });
        return uiStream;
      }

      async function getAssistantMessage(
        messages: AssistantMessage[],
        stream = skillsStream
      ) {
        const uiStream = await getUIStream(messages, stream);
        let message: AssistantMessage | undefined;
        for await (message of readUIMessageStream<AssistantMessage>({
          stream: uiStream,
        })) {
          // keep the latest message state
        }
        return message;
      }

      it('adds the skills from the stream to the message metadata', async function () {
        const message = await getAssistantMessage([
          {
            id: 'user',
            role: 'user',
            parts: [{ type: 'text', text: 'Model blog posts' }],
          },
        ]);
        expect(message?.metadata?.skillsUsed).to.deep.equal([
          'mongodb-schema-design',
          'mongodb-query-optimizer',
        ]);
      });

      it('does not add the skill function calls as tool calls', async function () {
        const message = await getAssistantMessage([
          {
            id: 'user',
            role: 'user',
            parts: [{ type: 'text', text: 'Model blog posts' }],
          },
        ]);
        expect(message?.parts.map((part) => part.type)).to.deep.equal([
          'step-start',
          'reasoning',
          'reasoning',
          'reasoning',
          'text',
        ]);
        expect(
          message?.parts.flatMap((part) =>
            part.type === 'reasoning' ? [part.text] : []
          )
        ).to.deep.equal([
          'Using skill: mongodb-schema-design',
          'Using skill: mongodb-query-optimizer',
          'Using skill: mongodb-schema-design',
        ]);
      });

      it('keeps client tool calls', async function () {
        const message = await getAssistantMessage(
          [
            {
              id: 'user',
              role: 'user',
              parts: [{ type: 'text', text: 'List my databases' }],
            },
          ],
          toolCallStream
        );
        expect(message?.parts.map((part) => part.type)).to.deep.equal([
          'step-start',
          'reasoning',
          'tool-list-databases',
        ]);
        expect(message?.parts[2]).to.include({
          type: 'tool-list-databases',
          toolCallId: 'call_2',
          state: 'input-available',
        });
        expect(message?.metadata?.skillsUsed).to.deep.equal([
          'mongodb-schema-design',
        ]);
      });

      it('reports the skills before the stream finishes', async function () {
        const uiStream = await getUIStream([
          {
            id: 'user',
            role: 'user',
            parts: [{ type: 'text', text: 'Model blog posts' }],
          },
        ]);
        const reportedSkills: unknown[] = [];
        for await (const chunk of uiStream) {
          if (chunk.type === 'text-start') {
            break;
          }
          if (chunk.type === 'message-metadata') {
            reportedSkills.push(
              (chunk.messageMetadata as AssistantMessage['metadata'])
                ?.skillsUsed
            );
          }
        }
        expect(reportedSkills.at(-1)).to.deep.equal([
          'mongodb-schema-design',
          'mongodb-query-optimizer',
        ]);
      });

      it('keeps the skills from earlier requests of the same message', async function () {
        const message = await getAssistantMessage([
          {
            id: 'user',
            role: 'user',
            parts: [{ type: 'text', text: 'Model blog posts' }],
          },
          {
            id: 'assistant',
            role: 'assistant',
            parts: [{ type: 'text', text: 'Listing databases' }],
            metadata: { skillsUsed: ['mongodb-natural-language-querying'] },
          },
        ]);
        expect(message?.metadata?.skillsUsed).to.deep.equal([
          'mongodb-natural-language-querying',
          'mongodb-schema-design',
          'mongodb-query-optimizer',
        ]);
      });

      it('ignores skill calls without a skill name', async function () {
        const noNameCall = {
          ...skillCall('call_1', 'unused'),
          arguments: '{}',
        };
        const message = await getAssistantMessage(
          [
            {
              id: 'user',
              role: 'user',
              parts: [{ type: 'text', text: 'Model blog posts' }],
            },
          ],
          [
            sseEvent({ type: 'response.created', response }),
            sseEvent({
              type: 'response.output_item.added',
              output_index: 0,
              item: { ...noNameCall, status: 'in_progress' },
            }),
            sseEvent({
              type: 'response.output_item.done',
              output_index: 0,
              item: { ...noNameCall, status: 'completed' },
            }),
            sseEvent({
              type: 'response.output_item.added',
              output_index: 1,
              item: { type: 'message', id: 'msg_1' },
            }),
            sseEvent({ type: 'response.output_text.delta', item_id: 'msg_1' }),
          ].join('')
        );
        expect(message?.parts.map((part) => part.type)).to.deep.equal([
          'step-start',
          'text',
        ]);
        expect(message?.metadata?.skillsUsed).to.equal(undefined);
      });

      it('does not send the skill reasoning parts back to the server', async function () {
        const warn = sinon.stub(console, 'warn');
        try {
          await getAssistantMessage([
            {
              id: 'user',
              role: 'user',
              parts: [{ type: 'text', text: 'Model blog posts' }],
            },
            {
              id: 'assistant',
              role: 'assistant',
              parts: [
                {
                  type: 'reasoning',
                  text: 'Using skill: mongodb-schema-design',
                },
                {
                  type: 'reasoning',
                  text: 'Real reasoning',
                  providerMetadata: { openai: { itemId: 'rs_1' } },
                },
                { type: 'text', text: 'Listing databases' },
              ],
            },
          ]);
          const { input } = JSON.parse(requestBodies[0]);
          expect(JSON.stringify(input)).to.not.include('Using skill:');
          expect(JSON.stringify(input)).to.include('rs_1');
          // The converter warns when it has to skip a reasoning part
          expect(warn).to.not.have.been.called;
        } finally {
          warn.restore();
        }
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
