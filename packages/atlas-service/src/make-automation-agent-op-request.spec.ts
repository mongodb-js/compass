import Sinon from 'sinon';
import { makeAutomationAgentOpRequest } from './make-automation-agent-op-request';
import { expect } from 'chai';

describe('makeAutomationAgentOpRequest', function () {
  const successSpecs = [
    [
      'succeeds if backend returned requestId and response',
      { _id: 'abc', requestType: 'listIndexStats' },
      {
        _id: 'abc',
        requestType: 'listIndexStats',
        response: [{ indexName: 'test' }],
      },
    ],
  ] as const;

  const failSpecs = [
    [
      'fails if initial request fails',
      new Error('NetworkError'),
      {},
      /NetworkError/,
    ],
    [
      'fails if await response fails',
      { _id: 'abc', requestType: 'listIndexStats' },
      new Error('NetworkError'),
      /NetworkError/,
    ],
    [
      'fails if backend did not return requestId',
      {},
      {},
      /Got unexpected backend response/,
    ],
    [
      'fails if backend returned requestId but no response',
      { _id: 'abc', requestType: 'listIndexStats' },
      {},
      /Got unexpected backend response/,
    ],
  ] as const;

  function getMockFetch(
    requestResponse: Record<string, unknown> | Error,
    awaitResponse: Record<string, unknown> | Error
  ) {
    return Sinon.stub()
      .onFirstCall()
      .callsFake(() => {
        return requestResponse instanceof Error
          ? Promise.reject(requestResponse)
          : Promise.resolve({
              ok: true,
              staus: 200,
              json() {
                return Promise.resolve(requestResponse);
              },
            });
      })
      .onSecondCall()
      .callsFake(() => {
        return awaitResponse instanceof Error
          ? Promise.reject(awaitResponse)
          : Promise.resolve({
              ok: true,
              staus: 200,
              json() {
                return Promise.resolve(awaitResponse);
              },
            });
      });
  }

  function getRequestBodyFromFnCall(call: Sinon.SinonSpyCall<any, any>) {
    return JSON.parse(call.args[1].body);
  }

  for (const [
    successSpecName,
    requestResponse,
    awaitResponse,
  ] of successSpecs) {
    it(successSpecName, async function () {
      const fetchFn = getMockFetch(requestResponse, awaitResponse);
      const res = await makeAutomationAgentOpRequest(
        fetchFn,
        'http://example.com',
        'abc',
        'listIndexStats',
        { clusterId: 'abc', db: 'db', collection: 'coll' }
      );
      expect(getRequestBodyFromFnCall(fetchFn.firstCall)).to.deep.eq({
        clusterId: 'abc',
        collection: 'coll',
        db: 'db',
      });
      expect(res).to.deep.eq(awaitResponse.response);
    });
  }

  for (const [
    failSpecName,
    requestResponse,
    awaitResponse,
    errorMessage,
  ] of failSpecs) {
    it(failSpecName, async function () {
      try {
        await makeAutomationAgentOpRequest(
          getMockFetch(requestResponse, awaitResponse),
          'http://example.com',
          'abc',
          'listIndexStats',
          { clusterId: 'abc', db: 'db', collection: 'coll' }
        );
        expect.fail('Expected makeAutomationAgentOpRequest call to fail');
      } catch (err) {
        expect((err as any).message).to.match(errorMessage);
      }
    });
  }
});
