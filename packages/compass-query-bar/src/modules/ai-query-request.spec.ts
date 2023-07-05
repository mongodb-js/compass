import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { ObjectId } from 'mongodb';
import type { Document } from 'mongodb';
import type { SimplifiedSchema } from 'mongodb-schema';

const { expect } = chai;
chai.use(chaiAsPromised);

import { runFetchAIQuery } from './ai-query-request';
import {
  startMockAIServer,
  TEST_AUTH_USERNAME,
  TEST_AUTH_PASSWORD,
} from '../../test/create-mock-ai-endpoint';

const mockUserPrompt: {
  userPrompt: string;
  collectionName: string;
  schema?: SimplifiedSchema;
  sampleDocuments?: Document[];
} = {
  userPrompt: 'test',
  collectionName: 'jam',
  schema: {
    _id: {
      types: [
        {
          bsonType: 'ObjectId',
        },
      ],
    },
  },
  sampleDocuments: [
    {
      _id: new ObjectId(),
    },
  ],
};

describe('#runFetchAIQuery', function () {
  describe('with a valid server endpoint set in the environment', function () {
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

      getRequests = _getRequests;
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

    it('makes a post request with the user prompt to the endpoint in the environment', async function () {
      const id = new ObjectId();
      const response = await runFetchAIQuery({
        userPrompt: 'test',
        signal: new AbortController().signal,
        collectionName: 'jam',
        schema: {
          _id: {
            types: [
              {
                bsonType: 'ObjectId',
              },
            ],
          },
        },
        sampleDocuments: [
          {
            _id: id,
          },
        ],
      });
      const requests = getRequests();
      expect(requests[0].content).to.deep.equal({
        userPrompt: 'test',
        collectionName: 'jam',
        schema: {
          _id: {
            types: [
              {
                bsonType: 'ObjectId',
              },
            ],
          },
        },
        sampleDocuments: [
          {
            _id: id.toString(),
          },
        ],
      });
      expect(requests[0].req.url).to.equal('/ai/api/v1/mql-query');

      expect(response).to.deep.equal({
        content: {
          query: {
            find: {
              test: 'pineapple',
            },
          },
        },
      });
    });

    it('uses the abort signal in the fetch request', async function () {
      const abortController = new AbortController();
      abortController.abort();

      const promise = runFetchAIQuery({
        ...mockUserPrompt,
        signal: abortController.signal,
      });

      await expect(promise).to.be.rejectedWith('The user aborted a request.');
    });

    it('throws if the request would be too much for the ai', async function () {
      const promise = runFetchAIQuery({
        ...mockUserPrompt,
        sampleDocuments: [
          {
            test: '4'.repeat(6000),
          },
        ],
        signal: new AbortController().signal,
      });

      await expect(promise).to.be.rejectedWith(
        'Error: too large of a request to send to the ai. Please use a smaller prompt or collection with smaller documents.'
      );
    });

    it('passes fewer documents if the request would be too much for the ai with all of the documents', async function () {
      const response = await runFetchAIQuery({
        ...mockUserPrompt,
        sampleDocuments: [
          {
            a: ['1'],
          },
          {
            a: ['2'],
          },
          {
            a: ['3'],
          },
          {
            a: ['4'.repeat(5000)],
          },
        ],
        signal: new AbortController().signal,
      });

      const requests = getRequests();
      expect(requests[0].content.sampleDocuments).to.deep.equal([
        {
          a: ['1'],
        },
      ]);
      expect(!!response).to.be.true;
    });
  });

  describe('with no endpoint set in environment', function () {
    it('throws an error', async function () {
      const promise = runFetchAIQuery({
        ...mockUserPrompt,
        signal: new AbortController().signal,
      });

      await expect(promise).to.be.rejectedWith(
        'No AI Query endpoint to fetch. Please set the environment variable `DEV_AI_QUERY_ENDPOINT`'
      );
    });
  });

  describe('when the endpoint is set and the server errors', function () {
    let stopServer: () => Promise<void>;

    beforeEach(async function () {
      // Start a mock server to pass an ai response.
      // Set the server endpoint in the env.
      const { endpoint, stop } = await startMockAIServer({
        response: {},
        sendError: true,
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

    it('throws the error', async function () {
      const promise = runFetchAIQuery({
        ...mockUserPrompt,
        signal: new AbortController().signal,
      });

      await expect(promise).to.be.rejectedWith(
        'Error: 500 Internal Server Error'
      );
    });
  });
});
