import Sinon from 'sinon';
import { expect } from 'chai';
import { AtlasAiService } from './atlas-ai-service';
import {
  AtlasAiServiceInvalidInputError,
  AtlasAiServiceApiResponseParseError,
} from './atlas-ai-errors';
import type { PreferencesAccess } from 'compass-preferences-model';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import { ObjectId } from 'mongodb';
import type { ConnectionInfo } from '@mongodb-js/connection-info';

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
  authenticatedFetch = (url: string, init: RequestInit) => {
    return fetch(url, init);
  };
  fetch = (url: string, init: RequestInit) => {
    return fetch(url, init);
  };
}

function makeResponse(content: any) {
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

  const endpointBasepathTests = [
    {
      apiURLPreset: 'admin-api',
      expectedEndpoints: {
        'mql-aggregation': `http://example.com/unauth/ai/api/v1/mql-aggregation?request_id=abc`,
        'mql-query': `http://example.com/unauth/ai/api/v1/mql-query?request_id=abc`,
      },
    },
    {
      apiURLPreset: 'cloud',
      expectedEndpoints: {
        'mql-aggregation':
          '/cloud/ai/v1/groups/testProject/mql-aggregation?request_id=abc',
        'mql-query': '/cloud/ai/v1/groups/testProject/mql-query?request_id=abc',
        'mock-data-schema':
          '/cloud/ai/v1/groups/testProject/mock-data-schema?request_id=abc',
      },
    },
  ] as const;

  for (const { apiURLPreset, expectedEndpoints } of endpointBasepathTests) {
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
          atlasService: mockAtlasService as any,
          preferences,
          logger: createNoopLogger(),
        });
      });

      describe('getQueryFromUserInput and getAggregationFromUserInput', function () {
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

        const atlasAIServiceTests = [
          {
            functionName: 'getQueryFromUserInput',
            aiEndpoint: 'mql-query',
            responses: {
              success: {
                content: { query: { filter: "{ test: 'pineapple' }" } },
              },
              invalid: [
                [undefined, 'internal server error'],
                [{}, 'unexpected response'],
                [{ countent: {} }, 'unexpected response'],
                [{ content: { qooery: {} } }, 'unexpected keys'],
                [
                  { content: { query: { filter: { foo: 1 } } } },
                  'unexpected response',
                ],
              ],
            },
          },
          {
            functionName: 'getAggregationFromUserInput',
            aiEndpoint: 'mql-aggregation',
            responses: {
              success: {
                content: {
                  aggregation: { pipeline: "[{ test: 'pineapple' }]" },
                },
              },
              invalid: [
                [undefined, 'internal server error'],
                [{}, 'unexpected response'],
                [{ content: { aggregation: {} } }, 'unexpected response'],
                [{ content: { aggrogation: {} } }, 'unexpected keys'],
                [
                  { content: { aggregation: { pipeline: true } } },
                  'unexpected response',
                ],
              ],
            },
          },
        ] as const;

        for (const {
          functionName,
          aiEndpoint,
          responses,
        } of atlasAIServiceTests) {
          describe(functionName, function () {
            it('makes a post request with the user input to the endpoint in the environment', async function () {
              const fetchStub = sandbox
                .stub()
                .resolves(makeResponse(responses.success));
              global.fetch = fetchStub;

              const res = await atlasAiService[functionName](
                {
                  userInput: 'test',
                  signal: new AbortController().signal,
                  collectionName: 'jam',
                  databaseName: 'peanut',
                  schema: { _id: { types: [{ bsonType: 'ObjectId' }] } },
                  sampleDocuments: [
                    { _id: new ObjectId('642d766b7300158b1f22e972') },
                  ],
                  requestId: 'abc',
                },
                mockConnectionInfo
              );

              expect(fetchStub).to.have.been.calledOnce;

              const { args } = fetchStub.firstCall;

              expect(args[0]).to.eq(expectedEndpoints[aiEndpoint]);
              expect(args[1].body).to.eq(
                '{"userInput":"test","collectionName":"jam","databaseName":"peanut","schema":{"_id":{"types":[{"bsonType":"ObjectId"}]}},"sampleDocuments":[{"_id":{"$oid":"642d766b7300158b1f22e972"}}]}'
              );
              expect(res).to.deep.eq(responses.success);
            });

            it('should fail when response is not matching expected schema', async function () {
              for (const [res, error] of responses.invalid) {
                const fetchStub = sandbox.stub().resolves(makeResponse(res));
                global.fetch = fetchStub;

                try {
                  await atlasAiService[functionName](
                    {
                      userInput: 'test',
                      collectionName: 'test',
                      databaseName: 'peanut',
                      requestId: 'abc',
                      signal: new AbortController().signal,
                    },
                    mockConnectionInfo
                  );
                  expect.fail(`Expected ${functionName} to throw`);
                } catch (err) {
                  expect((err as Error).message).to.match(
                    new RegExp(error, 'i')
                  );
                }
              }
            });

            it('throws if the request would be too much for the ai', async function () {
              try {
                await atlasAiService[functionName](
                  {
                    userInput: 'test',
                    collectionName: 'test',
                    databaseName: 'peanut',
                    sampleDocuments: [{ test: '4'.repeat(5120001) }],
                    requestId: 'abc',
                    signal: new AbortController().signal,
                  },
                  mockConnectionInfo
                );
                expect.fail(`Expected ${functionName} to throw`);
              } catch (err) {
                expect(err).to.have.property(
                  'message',
                  'Sorry, your request is too large. Please use a smaller prompt or try using this feature on a collection with smaller documents.'
                );
              }
            });

            it('passes fewer documents if the request would be too much for the ai with all of the documents', async function () {
              const fetchStub = sandbox
                .stub()
                .resolves(makeResponse(responses.success));
              global.fetch = fetchStub;

              await atlasAiService[functionName](
                {
                  userInput: 'test',
                  collectionName: 'test.test',
                  databaseName: 'peanut',
                  sampleDocuments: [
                    { a: '1' },
                    { a: '2' },
                    { a: '3' },
                    { a: '4'.repeat(5120001) },
                  ],
                  requestId: 'abc',
                  signal: new AbortController().signal,
                },
                mockConnectionInfo
              );

              const { args } = fetchStub.firstCall;

              expect(fetchStub).to.have.been.calledOnce;
              expect(args[1].body).to.eq(
                '{"userInput":"test","collectionName":"test.test","databaseName":"peanut","sampleDocuments":[{"a":"1"}]}'
              );
            });
          });
        }
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
                /mock-data-schema is not available for admin-api/i
              );
            }
          });
        }

        if (apiURLPreset === 'cloud') {
          it('makes a post request to the correct endpoint', async function () {
            const mockResponse = {
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
              .resolves(makeResponse(mockResponse));
            global.fetch = fetchStub;

            const result = await atlasAiService.getMockDataSchema(
              mockSchemaInput,
              mockConnectionInfo
            );

            expect(fetchStub).to.have.been.calledOnce;
            const { args } = fetchStub.firstCall;
            expect(args[0]).to.eq(
              '/cloud/ai/v1/groups/testProject/mock-data-schema?request_id=test-request-id'
            );
            expect(result).to.deep.equal(mockResponse);
          });

          it('includes sample values by default (includeSampleValues=true)', async function () {
            const mockResponse = {
              fields: [
                {
                  fieldPath: 'name',
                  fakerMethod: 'person.fullName',
                  fakerArgs: [],
                },
                {
                  fieldPath: 'age',
                  fakerMethod: 'number.int',
                  fakerArgs: [{ json: '{"min": 18, "max": 122}' }],
                },
              ],
            };
            const fetchStub = sandbox
              .stub()
              .resolves(makeResponse(mockResponse));
            global.fetch = fetchStub;

            await atlasAiService.getMockDataSchema(
              { ...mockSchemaInput, includeSampleValues: true },
              mockConnectionInfo
            );

            const { args } = fetchStub.firstCall;
            const requestBody = JSON.parse(args[1].body);

            expect(requestBody.schema.name.sampleValues).to.deep.equal([
              'John',
              'Jane',
              'Bob',
            ]);
            expect(requestBody.schema.age.sampleValues).to.deep.equal([
              25, 30, 35,
            ]);
          });

          it('excludes sample values when includeSampleValues=false', async function () {
            const mockResponse = {
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
              .resolves(makeResponse(mockResponse));
            global.fetch = fetchStub;

            await atlasAiService.getMockDataSchema(
              mockSchemaInput,
              mockConnectionInfo
            );

            const { args } = fetchStub.firstCall;
            const requestBody = JSON.parse(args[1].body);

            expect(requestBody.schema.name).to.not.have.property(
              'sampleValues'
            );
            expect(requestBody.schema.age).to.not.have.property('sampleValues');
            expect(requestBody.schema.name.type).to.equal('string');
          });

          it('makes POST request with correct headers and body structure', async function () {
            const mockResponse = {
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
              .resolves(makeResponse(mockResponse));
            global.fetch = fetchStub;

            await atlasAiService.getMockDataSchema(
              mockSchemaInput,
              mockConnectionInfo
            );

            const { args } = fetchStub.firstCall;

            expect(args[1].method).to.equal('POST');
            expect(args[1].headers['Content-Type']).to.equal(
              'application/json'
            );
            expect(args[1].headers['Accept']).to.equal('application/json');

            const requestBody = JSON.parse(args[1].body);
            expect(requestBody).to.have.property(
              'collectionName',
              'test-collection'
            );
            expect(requestBody).to.have.property('databaseName', 'test-db');
            expect(requestBody).to.have.property('schema');
          });

          it('throws AtlasAiServiceApiResponseParseError when API response has invalid format', async function () {
            const invalidMockResponse = {
              invalidField: 'invalid data',
              content: {
                wrongFieldName: [],
              },
            };
            const fetchStub = sandbox
              .stub()
              .resolves(makeResponse(invalidMockResponse));
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
                'Response does not match expected schema'
              );
            }
          });

          it('includes validation rules in request body when provided', async function () {
            const mockResponse = {
              fields: [
                {
                  fieldPath: 'email',
                  mongoType: 'String',
                  fakerMethod: 'internet.email',
                  fakerArgs: [],
                },
                {
                  fieldPath: 'age',
                  mongoType: 'Int32',
                  fakerMethod: 'number.int',
                  fakerArgs: [{ json: '{"min": 18, "max": 120}' }],
                },
              ],
            };
            const fetchStub = sandbox
              .stub()
              .resolves(makeResponse(mockResponse));
            global.fetch = fetchStub;

            const validationRules = {
              $jsonSchema: {
                bsonType: 'object',
                required: ['email', 'age'],
                properties: {
                  email: {
                    bsonType: 'string',
                    pattern:
                      '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
                  },
                  age: {
                    bsonType: 'int',
                    minimum: 18,
                    maximum: 120,
                  },
                },
              },
            };

            const inputWithValidationRules = {
              ...mockSchemaInput,
              validationRules,
            };

            await atlasAiService.getMockDataSchema(
              inputWithValidationRules,
              mockConnectionInfo
            );

            const { args } = fetchStub.firstCall;
            const requestBody = JSON.parse(args[1].body as string);

            expect(requestBody).to.have.property('validationRules');
            expect(requestBody.validationRules).to.deep.equal(validationRules);
          });

          it('includes null validation rules in request body when not provided', async function () {
            const mockResponse = {
              fields: [
                {
                  fieldPath: 'name',
                  mongoType: 'String',
                  fakerMethod: 'person.fullName',
                  fakerArgs: [],
                },
              ],
            };
            const fetchStub = sandbox
              .stub()
              .resolves(makeResponse(mockResponse));
            global.fetch = fetchStub;

            await atlasAiService.getMockDataSchema(
              mockSchemaInput,
              mockConnectionInfo
            );

            const { args } = fetchStub.firstCall;
            const requestBody = JSON.parse(args[1].body as string);

            expect(requestBody).to.have.property('validationRules');
            expect(requestBody.validationRules).to.be.null;
          });

          it('excludes validation rules from request body when explicitly undefined', async function () {
            const mockResponse = {
              fields: [
                {
                  fieldPath: 'name',
                  mongoType: 'String',
                  fakerMethod: 'person.fullName',
                  fakerArgs: [],
                },
              ],
            };
            const fetchStub = sandbox
              .stub()
              .resolves(makeResponse(mockResponse));
            global.fetch = fetchStub;

            const inputWithUndefinedValidationRules = {
              ...mockSchemaInput,
              validationRules: undefined,
            };

            await atlasAiService.getMockDataSchema(
              inputWithUndefinedValidationRules,
              mockConnectionInfo
            );

            const { args } = fetchStub.firstCall;
            const requestBody = JSON.parse(args[1].body as string);

            // When validationRules is undefined, JSON.stringify excludes it from the output
            expect(requestBody).to.not.have.property('validationRules');
          });
        }
      });
    });
  }
});
