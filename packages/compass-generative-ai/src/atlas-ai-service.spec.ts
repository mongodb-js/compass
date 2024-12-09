import Sinon from 'sinon';
import { expect } from 'chai';
import { AtlasAiService } from './atlas-ai-service';
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

const mockConnectionInfo: ConnectionInfo = {
  id: 'TEST',
  connectionOptions: {
    connectionString: 'mongodb://localhost:27020',
  },
  atlasMetadata: {
    orgId: 'testOrg',
    projectId: 'testProject',
    clusterName: 'pineapple',
    regionalBaseUrl: 'https://example.com',
    metricsId: 'metricsId',
    metricsType: 'replicaSet',
    instanceSize: 'M10',
    clusterType: 'REPLICASET',
    clusterUniqueId: 'clusterUniqueId',
  },
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
        'user-access': 'http://example.com/unauth/ai/api/v1/hello/1234',
        'mql-aggregation': `http://example.com/ai/api/v1/mql-aggregation?request_id=abc`,
        'mql-query': `http://example.com/ai/api/v1/mql-query?request_id=abc`,
      },
    },
    {
      apiURLPreset: 'cloud',
      expectedEndpoints: {
        'user-access': '/cloud/ai/v1/hello/1234',
        'mql-aggregation':
          '/cloud/ai/v1/groups/testProject/mql-aggregation?request_id=abc',
        'mql-query': '/cloud/ai/v1/groups/testProject/mql-query?request_id=abc',
      },
    },
  ] as const;

  for (const { apiURLPreset, expectedEndpoints } of endpointBasepathTests) {
    describe(`api URL Preset "${apiURLPreset}"`, function () {
      let atlasAiService: AtlasAiService;

      beforeEach(function () {
        const mockAtlasService = new MockAtlasService();
        atlasAiService = new AtlasAiService({
          apiURLPreset,
          atlasService: mockAtlasService as any,
          preferences,
          logger: createNoopLogger(),
        });
      });

      describe('ai api calls', function () {
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

        it('should set the cloudFeatureRolloutAccess true when returned true', async function () {
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

          const { args } = fetchStub.firstCall;

          expect(fetchStub).to.have.been.calledOnce;

          expect(args[0]).to.equal(expectedEndpoints['user-access']);

          currentCloudFeatureRolloutAccess =
            preferences.getPreferences().cloudFeatureRolloutAccess;
          expect(currentCloudFeatureRolloutAccess).to.deep.equal({
            GEN_AI_COMPASS: true,
          });
        });

        it('should set the cloudFeatureRolloutAccess false when returned false', async function () {
          const fetchStub = sandbox.stub().resolves(
            makeResponse({
              features: {
                GEN_AI_COMPASS: {
                  enabled: false,
                },
              },
            })
          );
          global.fetch = fetchStub;

          let currentCloudFeatureRolloutAccess =
            preferences.getPreferences().cloudFeatureRolloutAccess;
          expect(currentCloudFeatureRolloutAccess).to.equal(undefined);

          await atlasAiService['setupAIAccess']();

          const { args } = fetchStub.firstCall;

          expect(fetchStub).to.have.been.calledOnce;
          expect(args[0]).to.equal(expectedEndpoints['user-access']);

          currentCloudFeatureRolloutAccess =
            preferences.getPreferences().cloudFeatureRolloutAccess;
          expect(currentCloudFeatureRolloutAccess).to.deep.equal({
            GEN_AI_COMPASS: false,
          });
        });

        it('should set the cloudFeatureRolloutAccess false when returned null', async function () {
          const fetchStub = sandbox.stub().resolves(
            makeResponse({
              features: null,
            })
          );
          global.fetch = fetchStub;

          let currentCloudFeatureRolloutAccess =
            preferences.getPreferences().cloudFeatureRolloutAccess;
          expect(currentCloudFeatureRolloutAccess).to.equal(undefined);

          await atlasAiService['setupAIAccess']();

          const { args } = fetchStub.firstCall;

          expect(fetchStub).to.have.been.calledOnce;
          expect(args[0]).to.equal(expectedEndpoints['user-access']);

          currentCloudFeatureRolloutAccess =
            preferences.getPreferences().cloudFeatureRolloutAccess;
          expect(currentCloudFeatureRolloutAccess).to.deep.equal({
            GEN_AI_COMPASS: false,
          });
        });

        it('should not set the cloudFeatureRolloutAccess false when returned false', async function () {
          const fetchStub = sandbox.stub().throws(new Error('error'));
          global.fetch = fetchStub;

          let currentCloudFeatureRolloutAccess =
            preferences.getPreferences().cloudFeatureRolloutAccess;
          expect(currentCloudFeatureRolloutAccess).to.equal(undefined);

          await atlasAiService['setupAIAccess']();

          const { args } = fetchStub.firstCall;

          expect(fetchStub).to.have.been.calledOnce;
          expect(args[0]).to.equal(expectedEndpoints['user-access']);

          currentCloudFeatureRolloutAccess =
            preferences.getPreferences().cloudFeatureRolloutAccess;
          expect(currentCloudFeatureRolloutAccess).to.deep.equal(undefined);
        });
      });
    });
  }
});
