import { expect } from 'chai';
import { ObjectId } from 'mongodb';
import { promises as fs } from 'fs';
import os from 'os';

import configureStore from './query-bar-store';
import type { QueryBarStoreOptions } from './query-bar-store';
import {
  AIQueryActionTypes,
  cancelAIQuery,
  runAIQuery,
} from './ai-query-reducer';
import {
  startMockAIServer,
  TEST_AUTH_USERNAME,
  TEST_AUTH_PASSWORD,
} from '../../test/create-mock-ai-endpoint';

function _createStore(opts: Partial<QueryBarStoreOptions>) {
  return configureStore({
    dataProvider: {
      dataProvider: {
        getConnectionString: () =>
          ({
            hosts: [],
          } as any),
        sample: () =>
          Promise.resolve([
            {
              _id: new ObjectId(),
            },
          ]),
      },
    },
    ...opts,
  });
}

describe('aiQueryReducer', function () {
  let tmpDir: string;

  before(async function () {
    tmpDir = await fs.mkdtemp(os.tmpdir());
  });

  function createStore(opts: Partial<QueryBarStoreOptions> = {}) {
    return _createStore({
      basepath: tmpDir,
      ...opts,
    });
  }

  describe('runAIQuery', function () {
    describe('with a successful server response (mock server)', function () {
      let stopServer: () => Promise<void>;
      let getRequests: () => any[];

      beforeEach(async function () {
        // Start a mock server to pass an ai response.
        // Set the server endpoint in the env.
        const {
          endpoint,
          getRequests: _getRequests,
          stop,
        } = await startMockAIServer();

        stopServer = stop;
        getRequests = _getRequests;
        process.env.DEV_AI_QUERY_ENDPOINT = endpoint;
        process.env.DEV_AI_USERNAME = TEST_AUTH_USERNAME;
        process.env.DEV_AI_PASSWORD = TEST_AUTH_PASSWORD;
      });

      afterEach(async function () {
        await stopServer();
        delete process.env.DEV_AI_QUERY_ENDPOINT;
        delete process.env.DEV_AI_USERNAME;
        delete process.env.DEV_AI_PASSWORD;
      });

      it('should succeed', async function () {
        const sampleDocs = [
          {
            _id: new ObjectId(),
            a: {
              b: 3,
            },
          },
          {
            _id: new ObjectId(),
            a: {
              b: 'a',
            },
            c: 'pineapple',
          },
        ];
        const resultSchema = {
          _id: {
            types: [
              {
                bsonType: 'ObjectId',
              },
            ],
          },
          a: {
            types: [
              {
                bsonType: 'Document',
                fields: {
                  b: {
                    types: [
                      {
                        bsonType: 'Number',
                      },
                      {
                        bsonType: 'String',
                      },
                    ],
                  },
                },
              },
            ],
          },
          c: {
            types: [
              {
                bsonType: 'String',
              },
            ],
          },
        };
        const store = createStore({
          namespace: 'database.collection',
          dataProvider: {
            dataProvider: {
              getConnectionString: () =>
                ({
                  hosts: [],
                } as any),
              sample: () => Promise.resolve(sampleDocs),
            },
          },
        });
        let didSetFetchId = false;
        store.subscribe(() => {
          if (store.getState().aiQuery.aiQueryFetchId !== -1) {
            didSetFetchId = true;
          }
        });
        expect(store.getState().aiQuery.status).to.equal('ready');
        await store.dispatch(runAIQuery('testing prompt'));

        expect(didSetFetchId).to.equal(true);
        expect(getRequests()[0].content).to.deep.equal({
          userPrompt: 'testing prompt',
          schema: resultSchema,
          // Parse stringify to make _ids stringified for deep check.
          sampleDocuments: JSON.parse(JSON.stringify(sampleDocs)),
          collectionName: 'collection',
        });
        expect(store.getState().aiQuery.aiQueryFetchId).to.equal(-1);
        expect(store.getState().aiQuery.errorMessage).to.equal(undefined);
        expect(store.getState().aiQuery.status).to.equal('success');
      });
    });

    describe('when there is an error', function () {
      let stopServer: () => Promise<void>;

      beforeEach(async function () {
        const { endpoint, stop } = await startMockAIServer({
          response: {
            status: 500,
            body: 'test',
          },
        });

        stopServer = stop;
        process.env.DEV_AI_QUERY_ENDPOINT = endpoint;
        process.env.DEV_AI_USERNAME = TEST_AUTH_USERNAME;
        process.env.DEV_AI_PASSWORD = TEST_AUTH_PASSWORD;
      });

      afterEach(async function () {
        await stopServer();
        delete process.env.DEV_AI_QUERY_ENDPOINT;
        delete process.env.DEV_AI_USERNAME;
        delete process.env.DEV_AI_PASSWORD;
      });

      it('sets the error on the store', async function () {
        const store = createStore();
        expect(store.getState().aiQuery.errorMessage).to.equal(undefined);
        await store.dispatch(runAIQuery('testing prompt') as any);
        expect(store.getState().aiQuery.aiQueryFetchId).to.equal(-1);
        expect(store.getState().aiQuery.errorMessage).to.equal(
          'Error: 500 Internal Server Error'
        );
        expect(store.getState().aiQuery.status).to.equal('ready');
      });
    });
  });

  describe('cancelAIQuery', function () {
    it('should unset the fetching id on the store', function () {
      const store = createStore();
      expect(store.getState().aiQuery.aiQueryFetchId).to.equal(-1);

      store.dispatch({
        type: AIQueryActionTypes.AIQueryStarted,
        fetchId: 1,
      });

      expect(store.getState().aiQuery.aiQueryFetchId).to.equal(1);
      store.dispatch(cancelAIQuery());
      expect(store.getState().aiQuery.aiQueryFetchId).to.equal(-1);
    });
  });
});
