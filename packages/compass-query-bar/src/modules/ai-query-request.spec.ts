import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

const { expect } = chai;
chai.use(chaiAsPromised);

import { runFetchAIQuery } from './ai-query-request';
import { startMockAIServer } from '../../test/create-mock-ai-endpoint';

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
    });

    afterEach(async function () {
      await stopServer();
      delete process.env.DEV_AI_QUERY_ENDPOINT;
    });

    it('makes a post request with the user prompt to the endpoint in the environment', async function () {
      const response = await runFetchAIQuery({
        userPrompt: 'test',
        signal: new AbortController().signal,
      });
      const requests = getRequests();
      expect(requests[0].content).to.deep.equal({
        userPrompt: 'test',
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
        userPrompt: 'test',
        signal: abortController.signal,
      });

      await expect(promise).to.be.rejectedWith('The user aborted a request.');
    });
  });

  describe('with no endpoint set in environment', function () {
    it('throws an error', async function () {
      const promise = runFetchAIQuery({
        userPrompt: 'test',
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
    });

    afterEach(async function () {
      await stopServer();
      delete process.env.DEV_AI_QUERY_ENDPOINT;
    });

    it('throws the error', async function () {
      const promise = runFetchAIQuery({
        userPrompt: 'test',
        signal: new AbortController().signal,
      });

      await expect(promise).to.be.rejectedWith(
        'Error: 500 Internal Server Error'
      );
    });
  });
});
