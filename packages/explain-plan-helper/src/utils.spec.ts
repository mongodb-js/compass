import { expect } from 'chai';
import { getStageIndexFields } from './utils';

describe('utils', function () {
  context('getStageIndexFields', function () {
    const useCases = [
      {
        stage: 'IXSCAN',
        keyPattern: { a: 1, b: 1 },
        expected: { a: 1, b: 1 },
        testName:
          'returns the indexes for a stage when keyPattern is an object',
      },
      {
        stage: 'EXPRESS_IXSCAN',
        keyPattern: '{"a": 1, "b": 1}',
        expected: { a: 1, b: 1 },
        testName:
          'returns the indexes for a stage when keyPattern is a valid json object string',
      },
      {
        stage: 'EXPRESS_IXSCAN',
        keyPattern: '{"a": 1, "b": 1}',
        expected: { a: 1, b: 1 },
        testName:
          'returns the indexes for a stage when keyPattern is a valid js object string',
      },
      {
        stage: 'EXPRESS_IXSCAN',
        keyPattern: '{"a": c}',
        expected: {},
        testName: 'returns empty object when keyPattern is not parsable',
      },
      {
        stage: 'EXPRESS_IXSCAN',
        keyPattern: '{ key: "foo:bar" }',
        expected: { key: 'foo:bar' },
        testName:
          'returns the indexes for a stage when keyPattern is a valid js object string - 2',
      },
    ];

    for (const useCase of useCases) {
      it(useCase.testName, function () {
        const stage = {
          stage: useCase.stage,
          keyPattern: useCase.keyPattern,
        };
        expect(getStageIndexFields(stage as any)).to.deep.equal(
          useCase.expected
        );
      });
    }
  });
});
