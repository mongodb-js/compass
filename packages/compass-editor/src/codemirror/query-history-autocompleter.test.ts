import { expect } from 'chai';
import { scaleBetween } from './query-history-autocompleter';

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
