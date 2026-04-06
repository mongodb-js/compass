import Sinon from 'sinon';
import { expect } from 'chai';
import { AtlasAiService, type GenerativeAiInput } from './atlas-ai-service';
import {
  AtlasAiServiceInvalidInputError,
  AtlasAiServiceApiResponseParseError,
} from './atlas-ai-errors';
import type { PreferencesAccess } from 'compass-preferences-model';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import { ObjectId } from 'mongodb';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import type { AtlasService } from '@mongodb-js/atlas-service/provider';

const ATLAS_USER = {
  firstName: 'John',
  lastName: 'Doe',
  login: 'johndoe',
  primaryEmail: 'johndoe@mongodb.com',
  sub: '123',
};

const BASE_URL = 'http://example.com';

const getMockConnectionInfo = (): ConnectionInfo => {
  return {
    id: 'TEST',
    connectionOptions: {
      connectionString: 'mongodb://localhost:27020',
    },
    atlasMetadata: {
      orgId: 'testOrg',
      projectId: 'testProject',
      clusterName: 'pineapple',
      regionalBaseUrl: null,
      metricsId: 'metricsId',
      metricsType: 'replicaSet',
      instanceSize: 'M10',
      clusterType: 'REPLICASET',
      clusterUniqueId: 'clusterUniqueId',
      clusterState: 'IDLE',
      supports: {
        globalWrites: false,
        rollingIndexes: false,
      },
      userConnectionString: 'mongodb+srv://localhost:27020',
    },
  };
};

class MockAtlasService {
  getCurrentUser = () => Promise.resolve(ATLAS_USER);
  cloudEndpoint = (url: string) => `${['/cloud', url].join('/')}`;
  adminApiEndpoint = (url: string) => `${[BASE_URL, url].join('/')}`;
  assistantApiEndpoint = (url: string) => `${[BASE_URL, url].join('/')}`;
  authenticatedFetch = (url: string, init: RequestInit) => {
    return fetch(url, init);
  };
  fetch = (url: string, init: RequestInit) => {
    return fetch(url, init);
  };
}

function makeResponse(content: unknown) {
  return {
    ok: true,
    json: () => Promise.resolve(content),
    text: () => Promise.resolve(JSON.stringify(content)),
  };
}

describe('AtlasAiService', function () {
  let sandbox: Sinon.SinonSandbox;
  let preferences: PreferencesAccess;
  const initialFetch = global.fetch;

  beforeEach(async function () {
    sandbox = Sinon.createSandbox();
    preferences = await createSandboxFromDefaultPreferences();
    await preferences.savePreferences({
      telemetryAtlasUserId: '1234',
    });
  });

  afterEach(function () {
    sandbox.restore();
    global.fetch = initialFetch;
  });

  const endpointBasepathTests = ['admin-api', 'cloud'] as const;

  for (const apiURLPreset of endpointBasepathTests) {
    const describeName =
      apiURLPreset === 'admin-api'
        ? 'connection WITHOUT atlas metadata'
        : 'connection WITH atlas metadata';
    describe(describeName, function () {
      let atlasAiService: AtlasAiService;

      const mockConnectionInfo = getMockConnectionInfo();

      if (apiURLPreset === 'admin-api') {
        delete mockConnectionInfo.atlasMetadata;
      }

      beforeEach(function () {
        const mockAtlasService = new MockAtlasService();
        atlasAiService = new AtlasAiService({
          apiURLPreset,
          atlasService: mockAtlasService as unknown as AtlasService,
          preferences,
          logger: createNoopLogger(),
        });
      });

      describe('setupAIAccess', function () {
        beforeEach(async function () {
          await preferences.savePreferences({
            cloudFeatureRolloutAccess: undefined,
          });
        });

        it('should set the cloudFeatureRolloutAccess true', async function () {
          const fetchStub = sandbox.stub().resolves(
            makeResponse({
              features: {
                GEN_AI_COMPASS: {
                  enabled: true,
                },
              },
            })
          );
          global.fetch = fetchStub;

          let currentCloudFeatureRolloutAccess =
            preferences.getPreferences().cloudFeatureRolloutAccess;
          expect(currentCloudFeatureRolloutAccess).to.equal(undefined);

          await atlasAiService['setupAIAccess']();

          currentCloudFeatureRolloutAccess =
            preferences.getPreferences().cloudFeatureRolloutAccess;
          expect(currentCloudFeatureRolloutAccess).to.deep.equal({
            GEN_AI_COMPASS: true,
          });
        });
      });

      describe('optIntoGenAIFeatures', function () {
        beforeEach(async function () {
          // Reset preferences
          await preferences.savePreferences({
            optInGenAIFeatures: false,
          });
        });

        it('should save preference when cloud preset', async function () {
          const fetchStub = sandbox.stub().resolves(makeResponse({}));
          global.fetch = fetchStub;

          await atlasAiService.optIntoGenAIFeatures();

          // In Data Explorer, make a POST request to cloud endpoint and save preference
          if (apiURLPreset === 'cloud') {
            // Verify fetch was called with correct parameters
            expect(fetchStub).to.have.been.calledOnce;

            expect(fetchStub).to.have.been.calledWith(
              '/cloud/settings/optInDataExplorerGenAIFeatures',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  Accept: 'application/json',
                },
                body: new URLSearchParams([['value', 'true']]),
              }
            );
          } else {
            // In Compass, no fetch is made, only stored locally
            expect(fetchStub).to.not.have.been.called;
          }

          // Verify preference was saved
          const currentPreferences = preferences.getPreferences();
          expect(currentPreferences.optInGenAIFeatures).to.equal(true);
        });
      });

      describe('getMockDataSchema', function () {
        beforeEach(async function () {
          // Enable the AI feature
          const fetchStub = sandbox.stub().resolves(
            makeResponse({
              features: {
                GEN_AI_COMPASS: {
                  enabled: true,
                },
              },
            })
          );
          global.fetch = fetchStub;
          await atlasAiService['setupAIAccess']();
          global.fetch = initialFetch;
        });

        const mockSchemaInput = {
          collectionName: 'test-collection',
          databaseName: 'test-db',
          schema: {
            name: {
              type: 'string',
              sampleValues: ['John', 'Jane', 'Bob'],
            },
            age: {
              type: 'number',
              sampleValues: [25, 30, 35],
            },
          },
          validationRules: null,
          includeSampleValues: false,
          requestId: 'test-request-id',
          signal: new AbortController().signal,
        };

        /**
         * Mocks an OpenAI Responses API stream containing a completed tool call.
         */
        function createToolCallStreamResponse(
          toolName: string,
          toolArgs: Record<string, unknown>
        ): Response {
          const responseId = `resp_${Date.now()}`;
          const itemId = `item_${Date.now()}`;
          const callId = `call_${Date.now()}`;
          let sequenceNumber = 0;
          const encoder = new TextEncoder();

          const chunks: Uint8Array[] = [];

          // response.created event
          chunks.push(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'response.created',
                response: {
                  id: responseId,
                  object: 'realtime.response',
                  status: 'in_progress',
                  output: [],
                  usage: {
                    input_tokens: 0,
                    output_tokens: 0,
                    total_tokens: 0,
                  },
                },
                sequence_number: sequenceNumber++,
              })}\n\n`
            )
          );

          // response.output_item.added event for function_call
          chunks.push(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'response.output_item.added',
                output_index: 0,
                item: {
                  type: 'function_call',
                  id: itemId,
                  call_id: callId,
                  name: toolName,
                  arguments: '',
                },
                sequence_number: sequenceNumber++,
              })}\n\n`
            )
          );

          // Send function call arguments
          const argsString = JSON.stringify(toolArgs);
          chunks.push(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'response.function_call_arguments.delta',
                item_id: itemId,
                output_index: 0,
                delta: argsString,
                sequence_number: sequenceNumber++,
              })}\n\n`
            )
          );

          // response.output_item.done event
          chunks.push(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'response.output_item.done',
                output_index: 0,
                item: {
                  type: 'function_call',
                  id: itemId,
                  call_id: callId,
                  name: toolName,
                  arguments: argsString,
                  status: 'completed',
                },
                sequence_number: sequenceNumber++,
              })}\n\n`
            )
          );

          // response.completed event
          chunks.push(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'response.completed',
                response: {
                  id: responseId,
                  object: 'realtime.response',
                  status: 'completed',
                  output: [
                    {
                      type: 'function_call',
                      id: itemId,
                      call_id: callId,
                      name: toolName,
                      arguments: argsString,
                    },
                  ],
                  usage: {
                    input_tokens: 10,
                    output_tokens: 20,
                    total_tokens: 30,
                  },
                },
                sequence_number: sequenceNumber++,
              })}\n\n`
            )
          );

          const stream = new ReadableStream({
            start(controller) {
              for (const chunk of chunks) {
                controller.enqueue(chunk);
              }
              controller.close();
            },
          });

          return new Response(stream, {
            headers: { 'Content-Type': 'text/event-stream' },
          });
        }

        if (apiURLPreset === 'admin-api') {
          it('throws AtlasAiServiceInvalidInputError for admin-api preset', async function () {
            try {
              await atlasAiService.getMockDataSchema(
                mockSchemaInput,
                mockConnectionInfo
              );
              expect.fail(
                'Expected getMockDataSchema to throw for admin-api preset'
              );
            } catch (err) {
              expect(err).to.be.instanceOf(AtlasAiServiceInvalidInputError);
              expect((err as Error).message).to.match(
                /mock-data-schema requires Atlas connection/i
              );
            }
          });
        }

        if (apiURLPreset === 'cloud') {
          it('returns mock data schema from AI tool call', async function () {
            const mockToolOutput = {
              fields: [
                {
                  fieldPath: 'name',
                  fakerMethod: 'person.fullName',
                  fakerArgs: [],
                },
                {
                  fieldPath: 'age',
                  fakerMethod: 'number.int',
                  fakerArgs: [{ json: '{"min": 18, "max": 65}' }],
                },
              ],
            };
            const fetchStub = sandbox
              .stub()
              .resolves(
                createToolCallStreamResponse('mockDataSchema', mockToolOutput)
              );
            global.fetch = fetchStub;

            const result = await atlasAiService.getMockDataSchema(
              mockSchemaInput,
              mockConnectionInfo
            );

            expect(fetchStub).to.have.been.calledOnce;
            expect(result).to.deep.equal(mockToolOutput);
          });

          it('calls AI endpoint with correct URL format', async function () {
            const mockToolOutput = {
              fields: [
                {
                  fieldPath: 'name',
                  fakerMethod: 'person.fullName',
                  fakerArgs: [],
                },
              ],
            };
            const fetchStub = sandbox
              .stub()
              .resolves(
                createToolCallStreamResponse('mockDataSchema', mockToolOutput)
              );
            global.fetch = fetchStub;

            await atlasAiService.getMockDataSchema(
              mockSchemaInput,
              mockConnectionInfo
            );

            const { args } = fetchStub.firstCall;
            // The AI SDK uses the base URL to construct the endpoint
            expect(args[0]).to.include(BASE_URL);
          });

          it('strips sample values when includeSampleValues=false', async function () {
            const mockToolOutput = {
              fields: [
                {
                  fieldPath: 'name',
                  fakerMethod: 'person.fullName',
                  fakerArgs: [],
                },
              ],
            };
            const fetchStub = sandbox
              .stub()
              .resolves(
                createToolCallStreamResponse('mockDataSchema', mockToolOutput)
              );
            global.fetch = fetchStub;

            const schemaWithSamples = {
              ...mockSchemaInput,
              schema: {
                name: {
                  type: 'string',
                  sampleValues: ['SAMPLE_JOHN', 'SAMPLE_JANE'],
                },
                age: {
                  type: 'number',
                  sampleValues: [99999, 88888],
                },
              },
              includeSampleValues: false,
            };

            await atlasAiService.getMockDataSchema(
              schemaWithSamples,
              mockConnectionInfo
            );

            expect(fetchStub).to.have.been.calledOnce;

            const { args } = fetchStub.firstCall;
            const requestBody = args[1].body as string;

            // Verify sample values are not in the request
            expect(requestBody).to.not.include('SAMPLE_JOHN');
            expect(requestBody).to.not.include('SAMPLE_JANE');
            expect(requestBody).to.not.include('99999');
            expect(requestBody).to.not.include('88888');

            // Verify the schema fields are still present (type info)
            expect(requestBody).to.include('name');
            expect(requestBody).to.include('age');
            expect(requestBody).to.include("type: 'string'");
            expect(requestBody).to.include("type: 'number'");
          });

          it('includes sample values when includeSampleValues=true', async function () {
            const mockToolOutput = {
              fields: [
                {
                  fieldPath: 'name',
                  fakerMethod: 'person.fullName',
                  fakerArgs: [],
                },
              ],
            };
            const fetchStub = sandbox
              .stub()
              .resolves(
                createToolCallStreamResponse('mockDataSchema', mockToolOutput)
              );
            global.fetch = fetchStub;

            const schemaWithSamples = {
              ...mockSchemaInput,
              schema: {
                name: {
                  type: 'string',
                  sampleValues: ['SAMPLE_JOHN', 'SAMPLE_JANE'],
                },
                age: {
                  type: 'number',
                  sampleValues: [99999, 88888],
                },
              },
              includeSampleValues: true,
            };

            await atlasAiService.getMockDataSchema(
              schemaWithSamples,
              mockConnectionInfo
            );

            expect(fetchStub).to.have.been.calledOnce;

            // Inspect the request body to verify sample values are present
            const { args } = fetchStub.firstCall;
            const requestBody = args[1].body as string;

            // Verify sample values are in the request
            expect(requestBody).to.include('SAMPLE_JOHN');
            expect(requestBody).to.include('SAMPLE_JANE');
            expect(requestBody).to.include('99999');
            expect(requestBody).to.include('88888');
          });

          it('includes validation rules in the generated prompt', async function () {
            const VALIDATION_RULE = 'AGE_MUST_BE_21_OR_OLDER';
            let capturedRequestBody = '';

            const fetchStub = sandbox.stub().callsFake((...args: unknown[]) => {
              capturedRequestBody = String(
                (args[1] as { body?: string })?.body ?? ''
              );
              // Return a valid response so test doesn't error out
              return createToolCallStreamResponse('mockDataSchema', {
                fields: [
                  {
                    fieldPath: 'age',
                    fakerMethod: 'number.int',
                    fakerArgs: [],
                  },
                ],
              });
            }) as typeof fetch;
            global.fetch = fetchStub;

            await atlasAiService.getMockDataSchema(
              {
                ...mockSchemaInput,
                validationRules: {
                  $jsonSchema: {
                    bsonType: 'object',
                    properties: {
                      age: {
                        description: VALIDATION_RULE,
                        minimum: 21,
                      },
                    },
                  },
                },
              },
              mockConnectionInfo
            );

            expect(capturedRequestBody).to.include(VALIDATION_RULE);
          });

          it('throws AtlasAiServiceApiResponseParseError when no tool call returned', async function () {
            // Create a response with no tool calls (just text output)
            const responseId = `resp_${Date.now()}`;
            const itemId = `item_${Date.now()}`;
            let sequenceNumber = 0;
            const encoder = new TextEncoder();

            const chunks: Uint8Array[] = [];
            chunks.push(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'response.created',
                  response: {
                    id: responseId,
                    object: 'realtime.response',
                    status: 'in_progress',
                    output: [],
                    usage: {
                      input_tokens: 0,
                      output_tokens: 0,
                      total_tokens: 0,
                    },
                  },
                  sequence_number: sequenceNumber++,
                })}\n\n`
              )
            );
            chunks.push(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'response.output_item.added',
                  output_index: 0,
                  item: {
                    id: itemId,
                    type: 'message',
                    role: 'assistant',
                    content: [],
                  },
                  sequence_number: sequenceNumber++,
                })}\n\n`
              )
            );
            chunks.push(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'response.completed',
                  response: {
                    id: responseId,
                    object: 'realtime.response',
                    status: 'completed',
                    output: [
                      {
                        id: itemId,
                        type: 'message',
                        role: 'assistant',
                        content: [],
                      },
                    ],
                    usage: {
                      input_tokens: 10,
                      output_tokens: 5,
                      total_tokens: 15,
                    },
                  },
                  sequence_number: sequenceNumber++,
                })}\n\n`
              )
            );

            const stream = new ReadableStream({
              start(controller) {
                for (const chunk of chunks) {
                  controller.enqueue(chunk);
                }
                controller.close();
              },
            });

            const fetchStub = sandbox.stub().resolves(
              new Response(stream, {
                headers: { 'Content-Type': 'text/event-stream' },
              })
            );
            global.fetch = fetchStub;

            try {
              await atlasAiService.getMockDataSchema(
                mockSchemaInput,
                mockConnectionInfo
              );
              expect.fail(
                'Expected getMockDataSchema to throw AtlasAiServiceApiResponseParseError'
              );
            } catch (err) {
              expect(err).to.be.instanceOf(AtlasAiServiceApiResponseParseError);
              expect((err as Error).message).to.equal(
                'AI did not return expected mock data schema tool call'
              );
            }
          });
        }
      });
    });
  }
  describe('getQueryFromUserInput and getAggregationFromUserInput', function () {
    type Chunk = { type: 'text' | 'error'; content: string };
    let atlasAiService: AtlasAiService;
    const mockConnectionInfo = getMockConnectionInfo();

    function streamChunkResponse(
      readableStreamController: ReadableStreamController<Uint8Array>,
      chunks: Chunk[]
    ) {
      const responseId = `resp_${Date.now()}`;
      const itemId = `item_${Date.now()}`;
      let sequenceNumber = 0;

      const encoder = new TextEncoder();

      // openai response format:
      // https://github.com/vercel/ai/blob/811119c1808d7b62a4857bcad42353808cdba17c/packages/openai/src/responses/openai-responses-api.ts#L322

      // Send response.created event
      readableStreamController.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            type: 'response.created',
            response: {
              id: responseId,
              object: 'realtime.response',
              status: 'in_progress',
              output: [],
              usage: {
                input_tokens: 0,
                output_tokens: 0,
                total_tokens: 0,
              },
            },
            sequence_number: sequenceNumber++,
          })}\n\n`
        )
      );

      // Send output_item.added event
      readableStreamController.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            type: 'response.output_item.added',
            response_id: responseId,
            output_index: 0,
            item: {
              id: itemId,
              object: 'realtime.item',
              type: 'message',
              role: 'assistant',
              content: [],
            },
            sequence_number: sequenceNumber++,
          })}\n\n`
        )
      );

      for (const chunk of chunks) {
        if (chunk.type === 'error') {
          readableStreamController.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: `error`,
                response_id: responseId,
                item_id: itemId,
                output_index: 0,
                error: {
                  type: 'model_error',
                  code: 'model_error',
                  message: chunk.content,
                },
                sequence_number: sequenceNumber++,
              })}\n\n`
            )
          );
        } else {
          readableStreamController.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'response.output_text.delta',
                response_id: responseId,
                item_id: itemId,
                output_index: 0,
                delta: chunk.content,
                sequence_number: sequenceNumber++,
              })}\n\n`
            )
          );
        }
      }

      const content = chunks
        .filter((c) => c.type === 'text')
        .map((c) => c.content)
        .join('');

      // Send output_item.done event
      readableStreamController.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            type: 'response.output_item.done',
            response_id: responseId,
            output_index: 0,
            item: {
              id: itemId,
              object: 'realtime.item',
              type: 'message',
              role: 'assistant',
              content: [
                {
                  type: 'text',
                  text: content,
                },
              ],
            },
            sequence_number: sequenceNumber++,
          })}\n\n`
        )
      );

      // Send response.completed event
      const tokenCount = Math.ceil(content.length / 4); // assume 4 chars per token
      readableStreamController.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            type: 'response.completed',
            response: {
              id: responseId,
              object: 'realtime.response',
              status: 'completed',
              output: [
                {
                  id: itemId,
                  object: 'realtime.item',
                  type: 'message',
                  role: 'assistant',
                  content: [
                    {
                      type: 'text',
                      text: content,
                    },
                  ],
                },
              ],
              usage: {
                input_tokens: 10,
                output_tokens: tokenCount,
                total_tokens: 10 + tokenCount,
              },
            },
            sequence_number: sequenceNumber++,
          })}\n\n`
        )
      );
    }

    function streamableFetchMock(chunks: Chunk[]) {
      const readableStream = new ReadableStream({
        start(controller) {
          streamChunkResponse(controller, chunks);
          controller.close();
        },
      });
      return new Response(readableStream, {
        headers: { 'Content-Type': 'text/event-stream' },
      });
    }

    beforeEach(async function () {
      const mockAtlasService = new MockAtlasService();
      atlasAiService = new AtlasAiService({
        apiURLPreset: 'cloud',
        atlasService: mockAtlasService as unknown as AtlasService,
        preferences,
        logger: createNoopLogger(),
      });
      // Enable the AI feature
      const fetchStub = sandbox.stub().resolves(
        makeResponse({
          features: {
            GEN_AI_COMPASS: {
              enabled: true,
            },
          },
        })
      );
      global.fetch = fetchStub;
      await atlasAiService['setupAIAccess']();
    });

    after(function () {
      global.fetch = initialFetch;
    });

    const testCases = [
      {
        functionName: 'getQueryFromUserInput',
        successResponse: {
          request: [
            { type: 'text', content: 'Hello' },
            { type: 'text', content: ' world' },
            {
              type: 'text',
              content: '. This is some non relevant text in the output',
            },
            { type: 'text', content: '<filter>{test: ' },
            { type: 'text', content: '"pineapple"' },
            { type: 'text', content: '}</filter>' },
          ] as Chunk[],
          response: {
            content: {
              aggregation: {
                pipeline: '',
              },
              query: {
                filter: "{test:'pineapple'}",
                project: null,
                sort: null,
                skip: null,
                limit: null,
              },
            },
          },
        },
        invalidModelResponse: {
          request: [
            { type: 'text', content: 'Hello' },
            { type: 'text', content: ' world.' },
            { type: 'text', content: '<filter>{test: ' },
            { type: 'text', content: '"pineapple"' },
            { type: 'text', content: '}</filter>' },
            { type: 'error', content: 'Model crashed!' },
          ] as Chunk[],
          errorMessage: 'Model crashed!',
        },
      },
      {
        functionName: 'getAggregationFromUserInput',
        successResponse: {
          request: [
            { type: 'text', content: 'Hello' },
            { type: 'text', content: ' world' },
            {
              type: 'text',
              content: '. This is some non relevant text in the output',
            },
            { type: 'text', content: '<aggregation>[{$count: ' },
            { type: 'text', content: '"pineapple"' },
            { type: 'text', content: '}]</aggregation>' },
          ] as Chunk[],
          response: {
            content: {
              aggregation: {
                pipeline: "[{$count:'pineapple'}]",
              },
            },
          },
        },
        invalidModelResponse: {
          request: [
            { type: 'text', content: 'Hello' },
            { type: 'text', content: ' world.' },
            { type: 'text', content: '<aggregation>[{test: ' },
            { type: 'text', content: '"pineapple"' },
            { type: 'text', content: '}]</aggregation>' },
            { type: 'error', content: 'Model crashed!' },
          ] as Chunk[],
          errorMessage: 'Model crashed!',
        },
      },
    ] as const;

    for (const {
      functionName,
      successResponse,
      invalidModelResponse,
    } of testCases) {
      describe(functionName, function () {
        it('makes a post request with the user input to the endpoint in the environment', async function () {
          const fetchStub = sandbox
            .stub()
            .resolves(streamableFetchMock(successResponse.request));
          global.fetch = fetchStub;

          const input: GenerativeAiInput = {
            userInput: 'test',
            signal: new AbortController().signal,
            collectionName: 'jam',
            databaseName: 'peanut',
            schema: { _id: { types: [{ bsonType: 'ObjectId' }] } },
            sampleDocuments: [
              { _id: new ObjectId('642d766b7300158b1f22e972') },
            ],
            requestId: 'abc',
            enableStorage: true,
          };

          const res = await atlasAiService[functionName](
            input,
            mockConnectionInfo
          );

          expect(fetchStub).to.have.been.calledOnce;

          const { args } = fetchStub.firstCall;
          const requestHeaders = args[1].headers as Record<string, string>;
          expect(requestHeaders['x-client-request-id']).to.equal(
            input.requestId
          );
          expect(requestHeaders['x-assistant-entrypoint']).to.equal(
            'natural-language-to-mql'
          );
          const requestBody = JSON.parse(args[1].body as string);
          const { analytics_id, ...restOfMetadata } = requestBody.metadata;
          expect(restOfMetadata).to.deep.equal({
            sensitive_storage: 'true',
          });
          expect(analytics_id).to.be.a('string').that.is.not.empty;
          expect(requestBody.store, 'store is always false').to.be.false;
          expect(requestBody.instructions).to.be.a('string');
          expect(requestBody.input).to.be.an('array');

          const { role, content } = requestBody.input[0];
          expect(role).to.equal('user');
          expect(content[0].text).to.include(
            `Database name: "${input.databaseName}"`
          );
          expect(content[0].text).to.include(
            `Collection name: "${input.collectionName}"`
          );
          expect(content[0].text).to.include(
            `_id: 'ObjectId`,
            'includes schema information in the prompt'
          );
          expect(res).to.deep.eq(successResponse.response);
        });

        it('should throw an error when the stream contains an error chunk', async function () {
          const fetchStub = sandbox
            .stub()
            .resolves(streamableFetchMock(invalidModelResponse.request));
          global.fetch = fetchStub;

          try {
            await atlasAiService[functionName](
              {
                userInput: 'test',
                collectionName: 'test',
                databaseName: 'peanut',
                requestId: 'abc',
                signal: new AbortController().signal,
                enableStorage: true,
              },
              mockConnectionInfo
            );
            expect.fail(`Expected ${functionName} to throw`);
          } catch (err) {
            expect((err as Error).message).to.match(
              new RegExp(invalidModelResponse.errorMessage, 'i')
            );
          }
        });
      });
    }
  });
});
