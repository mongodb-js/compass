import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

const { expect } = chai;
chai.use(chaiAsPromised);

import { runFetchAIQuery } from './ai-query-request';

describe('#runFetchAIQuery', function () {
  describe('with a valid server endpoint set in the environment', function () {
    beforeEach(function () {
      // TODO:
      // Start a mock server to pass an ai response.
      // Set the server endpoint in the env.
    });

    it('makes a post request with the user prompt to the endpoint in the environment', async function () {
      const response = await runFetchAIQuery({
        userPrompt: 'test',
        signal: new AbortController().signal,
      });
      expect(response).to.deep.equal({
        query: {
          filter: {
            test: true,
          },
        },
      });
    });

    it('uses the abort signal in the fetch request', async function () {
      const abortController = new AbortController();
      abortController.abort();

      const response = await runFetchAIQuery({
        userPrompt: 'test',
        signal: abortController.signal,
      });

      // TODO
      expect(response).to.equal('not this');
    });
  });

  describe('with no endpoint set in environment', function () {
    it('throws an error', async function () {
      const promise = runFetchAIQuery({
        userPrompt: 'test',
        signal: new AbortController().signal,
      });

      await expect(promise).to.be.rejectedWith(
        'No AI Query endpoint to fetch. Please specific in the environment variable `DEV_AI_QUERY_ENDPOINT`'
      );
    });
  });

  describe('when the endpoint is set and the server errors', function () {
    beforeEach(async function () {
      // TODO:
      // Start a mock server to pass an ai response.
      // Set the server endpoint in the env.
    });

    it('throws the error', async function () {
      const promise = runFetchAIQuery({
        userPrompt: 'test',
        signal: new AbortController().signal,
      });

      await expect(promise).to.be.rejectedWith(
        'No AI Query endpoint to fetch. Please specific in the environment variable `DEV_AI_QUERY_ENDPOINT`'
      );
    });
  });
});
