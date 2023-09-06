import { expect } from 'chai';
import { isQueryEqual } from './index';

describe('utils', function () {
  describe('isQueryEqual', function () {
    it('should return true when documents are deeply equal', function () {
      expect(
        isQueryEqual({ foo: { bar: 1, buz: 2 } }, { foo: { bar: 1, buz: 2 } })
      ).to.eq(true);
    });

    it('should return false when documents are deeply equal, except for key order', function () {
      expect(
        isQueryEqual({ foo: { bar: 1, buz: 2 } }, { foo: { buz: 2, bar: 1 } })
      ).to.eq(false);
    });

    it('should return false when documents are not equal', function () {
      expect(
        isQueryEqual({ foo: { bar: 1, buz: 2 } }, { meow: { woof: true } })
      ).to.eq(false);
    });
  });
});
