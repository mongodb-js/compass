import { expect } from 'chai';
import { lenientlyFixQuery } from './leniently-fix-query';

describe('lenientlyFixQuery [Utils]', function () {
  describe('when the value is empty', function () {
    it('returns a fix action with the wrapping braces', function () {
      const query = lenientlyFixQuery(' ');
      expect(query).to.equal('\\{${}}');
    });
  });

  describe('when the value might be a valid query', function () {
    it('should wrap the valid query between braces', function () {
      const query = lenientlyFixQuery('a: 1');
      expect(query).to.equal('\\{a: 1${}}');
    });
  });

  describe('when an existing query was pasted and is valid', function () {
    it('returns a no-op with the existing query', function () {
      const query = lenientlyFixQuery('{ query: 1 }');

      expect(query).to.equal(false);
    });
  });

  describe('when an existing query was pasted with duplicated braces on the ends', function () {
    it('returns a fixed query with removed duplicated braces', function () {
      const query = lenientlyFixQuery('{{ query: 1 }}');

      expect(query).to.equal('\\{ query: 1 ${}}');
    });
  });
});
