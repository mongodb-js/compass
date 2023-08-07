import { expect } from 'chai';
import { lenientlyFixQuery } from './leniently-fix-query';

describe('lenientlyFixQuery [Utils]', function () {
  describe('when the value is empty', function () {
    it('returns a fix action with the wrapping braces', function () {
      const [newQuery, position] = lenientlyFixQuery(' ');
      expect(newQuery).to.equal('{}');
      expect(position).to.equal(1);
    });
  });

  describe('when the value might be a valid query', function () {
    it('should wrap the valid query between braces', function () {
      const [newQuery, position] = lenientlyFixQuery('a: 1');
      expect(newQuery).to.equal('{a: 1}');
      expect(position).to.equal(5);
    });
  });

  describe('when an existing query was pasted and is valid', function () {
    it('returns a no-op with the existing query', function () {
      const validQuery = '{ query: 1 }';
      const [newQuery, position] = lenientlyFixQuery(validQuery);

      expect(newQuery).to.equal(validQuery);
      expect(position).to.equal(undefined);
    });
  });

  describe('when an existing query was pasted with duplicated braces on the ends', function () {
    it('returns a fixed query with removed duplicated braces', function () {
      const invalidQuery = '{{ query: 1 }}';
      const [newQuery, position] = lenientlyFixQuery(invalidQuery);

      expect(newQuery).to.equal('{ query: 1 }');
      expect(position).to.equal(11);
    });
  });
});
