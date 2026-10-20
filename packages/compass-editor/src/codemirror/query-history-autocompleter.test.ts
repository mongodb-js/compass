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
  const query = {
    type: 'favorite',
    lastExecuted: new Date('2023-06-03T16:00:00Z'),
    queryProperties: {
      filter:
        "{\n  // a comment\n  _id: ObjectId('507f1f77bcf86cd799439011')\n}",
      project: '{}',
      limit: 0,
    },
  };

  it('should return an empty string if the property does not exist', () => {
    expect(createQueryLabel(query, 'collation')).to.equal('');
  });

  it('should return the saved query string as it is', () => {
    expect(createQueryLabel(query, 'filter')).to.equal(
      query.queryProperties.filter
    );
  });

  it('should return the string representation of the property even when it is falsy', () => {
    expect(createQueryLabel(query, 'limit')).to.equal('0');
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
        filter: "{ count: NumberLong('9007199254740993') }",
        project: '{ _id: 0 }',
        sort: '{ score: -1 }',
        hint: "'score_1'",
        limit: 20,
        maxTimeMS: 1000,
      },
    });
    expect(result).to.equal(
      "{ count: NumberLong('9007199254740993') }, project: { _id: 0 }, sort: { score: -1 }, hint: 'score_1', limit: 20, maxTimeMS: 1000"
    );
  });

  it('should skip empty or undefined property values', () => {
    const result = createQueryDisplayLabel({
      type: 'favorite',
      lastExecuted: new Date('2023-06-03T16:00:00Z'),
      queryProperties: {
        filter: "{ name: 'pineapple' }",
        project: '',
        sort: undefined,
        limit: 0,
      },
    });
    expect(result).to.equal("{ name: 'pineapple' }, limit: 0");
  });
});
