import { expect } from 'chai';
import {
  createQueryDisplayLabel,
  createQueryLabel,
  scaleBetween,
} from './query-history-autocompleter';

describe('scaleBetween', function () {
  // args: unscaledNum, newScaleMin, newScaleMax, originalScaleMin, originalScaleMax
  it('should scale a number the same if given same range', function () {
    const result = scaleBetween(5, 0, 10, 0, 10);
    expect(result).to.equal(5);
  });

  it('should scale a number halfway', function () {
    const result = scaleBetween(5, -99, 99, 0, 10);
    expect(result).to.equal(0);
  });

  it('should scale the minimum value to the minimum allowed', function () {
    const result = scaleBetween(-1000, -99, 99, -1000, 1000);
    expect(result).to.equal(-99);
  });

  it('should return midpoint when min equals max', function () {
    const result = scaleBetween(10, 20, 30, 10, 10);
    expect(result).to.equal(25);
  });
});

describe('createQueryLabel', function () {
  it('should return an empty string if the property does not exist', () => {
    const result = createQueryLabel(
      {
        type: 'favorite',
        lastExecuted: new Date('2023-06-03T16:00:00Z'),
        queryProperties: {
          filter: { name: 'pineapple' },
          project: {},
          sort: undefined,
          limit: undefined,
        },
      },
      'collation'
    );
    expect(result).to.equal('');
  });

  it('should return the string representation of the property value if it exists', () => {
    const result = createQueryLabel(
      {
        type: 'favorite',
        lastExecuted: new Date('2023-06-03T16:00:00Z'),
        queryProperties: {
          filter: { name: 'pineapple' },
          project: {},
          sort: undefined,
          limit: undefined,
        },
      },
      'filter'
    );
    expect(result).to.equal("{\n  name: 'pineapple'\n}");
  });

  it('should return an empty string if the property value is undefined', () => {
    const result = createQueryLabel(
      {
        type: 'favorite',
        lastExecuted: new Date('2023-06-03T16:00:00Z'),
        queryProperties: {
          filter: { name: 'pineapple' },
          project: {},
          sort: undefined,
          limit: undefined,
        },
      },
      'exampleProperty'
    );
    expect(result).to.equal('');
  });
});

describe('createQueryDisplayLabel', function () {
  it('should return an empty string if queryProperties is empty', () => {
    const result = createQueryDisplayLabel({
      type: 'recent',
      lastExecuted: new Date('2023-06-03T16:00:00Z'),
      queryProperties: {},
    });
    expect(result).to.equal('');
  });

  it('should return a formatted label for multiple properties', () => {
    const result = createQueryDisplayLabel({
      type: 'favorite',
      lastExecuted: new Date('2023-06-03T16:00:00Z'),
      queryProperties: {
        filter: { name: 'pineapple' },
        project: { _id: 0 },
        sort: { score: -1 },
        hint: { indexName: 'score_1' },
        limit: 20,
        maxTimeMS: 1000,
      },
    });
    expect(result).to.equal(`{
 name: 'pineapple'
}, project: {
 _id: 0
}, sort: {
 score: -1
}, hint: {
 indexName: 'score_1'
}, limit: 20, maxTimeMS: 1000`);
  });

  it('should handle empty or undefined property values', () => {
    const result = createQueryDisplayLabel({
      type: 'favorite',
      lastExecuted: new Date('2023-06-03T16:00:00Z'),
      queryProperties: {
        filter: { name: 'pineapple' },
        project: {},
        sort: undefined,
        limit: undefined,
      },
    });
    expect(result).to.equal(`{
 name: 'pineapple'
}, project: {}, sort: undefined, limit: undefined`);
  });
});
