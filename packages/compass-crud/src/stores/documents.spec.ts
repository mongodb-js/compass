import { expect } from 'chai';
import {
  isCountHintSafe,
  isInitialQuery,
  isEqualSafeContent,
} from './documents';

describe('documents helpers', function () {
  describe('isCountHintSafe', function () {
    it('returns false for time-series collections', function () {
      expect(isCountHintSafe({}, true)).to.equal(false);
    });

    it('returns false when the query has a filter', function () {
      expect(isCountHintSafe({ filter: { name: 'foo' } }, false)).to.equal(
        false
      );
    });

    it('returns true for an empty filter on a regular collection', function () {
      expect(isCountHintSafe({}, false)).to.equal(true);
      expect(isCountHintSafe({ filter: {} }, false)).to.equal(true);
    });
  });

  describe('isInitialQuery', function () {
    it('returns true for an empty query', function () {
      expect(isInitialQuery()).to.equal(true);
      expect(isInitialQuery({})).to.equal(true);
      expect(isInitialQuery({ filter: {} })).to.equal(true);
      expect(isInitialQuery({ project: {} })).to.equal(true);
      expect(isInitialQuery({ collation: {} })).to.equal(true);
    });

    it('returns false when filter, project or collation are set', function () {
      expect(isInitialQuery({ filter: { a: 1 } })).to.equal(false);
      expect(isInitialQuery({ project: { a: 1 } })).to.equal(false);
      expect(isInitialQuery({ collation: { locale: 'en' } })).to.equal(false);
    });
  });

  describe('isEqualSafeContent', function () {
    it('returns true for reference-equal values', function () {
      const value = [{ a: 1 }];
      expect(isEqualSafeContent(value, value)).to.equal(true);
    });

    it('returns true for structurally equal values', function () {
      expect(isEqualSafeContent([{ a: 1 }], [{ a: 1 }])).to.equal(true);
    });

    it('returns false for differing values', function () {
      expect(isEqualSafeContent([{ a: 1 }], [{ a: 2 }])).to.equal(false);
    });

    it('returns false when serialization throws', function () {
      const circular: Record<string, unknown> = Object.create(null);
      circular.self = circular;
      expect(isEqualSafeContent(circular, {})).to.equal(false);
    });
  });
});
