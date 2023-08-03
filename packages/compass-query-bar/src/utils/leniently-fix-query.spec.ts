import { expect } from 'chai';
import { FixQueryAction, lenientlyFixQuery } from './leniently-fix-query';

describe.only('lenientlyFixQuery [Utils]', function () {
  describe('when the value is empty', function () {
    it('returns a fix action with the wrapping brances', function () {
      const [action, newQuery, caretPosition] = lenientlyFixQuery(' ');
      expect(action).to.equal(FixQueryAction.ADDED_WRAPPING_BRACES_ON_EMPTY);
      expect(newQuery).to.equal('{}');
      expect(caretPosition).to.equal(1);
    });
  });

  describe('when the value is just a single character', function () {
    it('returns a fix action with the wrapping braces', function () {
      const [action, newQuery, caretPosition] = lenientlyFixQuery('a');
      expect(action).to.equal(FixQueryAction.ADDED_WRAPPING_BRACES);
      expect(newQuery).to.equal('{a}');
      expect(caretPosition).to.equal(2);
    });
  });

  describe('when an existing query was pasted and is valid', function () {
    it('returns a no-op with the existing query', function () {
      const validQuery = '{ query: 1 }';
      const [action, newQuery, caretPosition] = lenientlyFixQuery(validQuery);

      expect(action).to.equal(FixQueryAction.NOTHING_FIXED);
      expect(newQuery).to.equal(validQuery);
      expect(caretPosition).to.equal(undefined);
    });
  });

  describe('when an existing query was pasted with duplicated braces on the ends', function () {
    it('returns a fixed query with removed duplicated braces', function () {
      const invalidQuery = '{{ query: 1 }}';
      const [action, newQuery, caretPosition] = lenientlyFixQuery(invalidQuery);

      expect(action).to.equal(FixQueryAction.REMOVED_WRAPPING_BRACES);
      expect(newQuery).to.equal('{ query: 1 }');
      expect(caretPosition).to.equal(12);
    });
  });
});
