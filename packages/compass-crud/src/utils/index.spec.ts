import { expect } from 'chai';

import {
  objectContainsRegularExpression,
  shouldShowUnboundArrayInsight,
  validateSort,
} from './';
import Document from 'hadron-document';
import { BSON } from 'bson';

describe('utils', function () {
  describe('objectContainsRegularExpression', function () {
    it('tells whether an object contains a regular expression', function () {
      expect(objectContainsRegularExpression(null)).to.equal(false);
      expect(objectContainsRegularExpression(undefined)).to.equal(false);
      expect(objectContainsRegularExpression(1)).to.equal(false);
      expect(objectContainsRegularExpression('str')).to.equal(false);
      expect(objectContainsRegularExpression({})).to.equal(false);
      expect(objectContainsRegularExpression({ x: 1 })).to.equal(false);
      expect(objectContainsRegularExpression({ x: /re/ })).to.equal(true);
    });
  });

  describe('shouldShowUnboundArrayInsight', function () {
    it('should return true when document matches criteria', function () {
      const values = [{ a: 1 }, new BSON.ObjectId(), 'a'];

      for (const val of values) {
        const doc = new Document({ a: [val] });
        expect(shouldShowUnboundArrayInsight(doc, 1)).to.eq(true);
        const nested = new Document({ a: { b: { c: [val] } } });
        expect(shouldShowUnboundArrayInsight(nested, 1)).to.eq(true);
      }
    });

    it("should return false when document doesn't match criteria", function () {
      const tooSmall = new Document({ a: [{}] });
      expect(shouldShowUnboundArrayInsight(tooSmall, 5)).to.eq(false);
      const wrongType = new Document({ a: [1.2] });
      expect(shouldShowUnboundArrayInsight(wrongType, 1)).to.eq(false);
      const noArray = new Document({ a: { b: { c: true } } });
      expect(shouldShowUnboundArrayInsight(noArray, 1)).to.eq(false);
    });
  });

  describe('validateSort', function () {
    it('should return the parsed value for valid sort input', function () {
      expect(validateSort('{ "a": 1 }')).to.deep.equal({ a: 1 });
      expect(validateSort('{ "a": -1 }')).to.deep.equal({ a: -1 });
      expect(validateSort('{ "a": "asc" }')).to.deep.equal({ a: 'asc' });
      expect(validateSort('{ "a": "desc" }')).to.deep.equal({ a: 'desc' });
      expect(validateSort('[["a", 1], ["b", -1]]')).to.deep.equal([
        ['a', 1],
        ['b', -1],
      ]);
      expect(validateSort('{ "a": { $meta: "textScore" } }')).to.deep.equal({
        a: { $meta: 'textScore' },
      });
    });

    it('should return null for invalid sort input', function () {
      expect(validateSort('{ "a": 0 }')).to.equal(null);
      expect(validateSort('{ "a": "invalid" }')).to.equal(null);
      expect(validateSort('[["a", 0]]')).to.equal(null);
      expect(validateSort('not a json')).to.equal(null);
    });
  });
});
