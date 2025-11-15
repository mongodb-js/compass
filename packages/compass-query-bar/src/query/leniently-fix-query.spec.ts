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

  describe('when an ObjectId is pasted alone', function () {
    it('returns a fix action with _id: ObjectId("<id>")', function () {
      const query = lenientlyFixQuery('{578cfb38d5021e616087f53f}');
      expect(query).to.equal('{ _id: ObjectId("578cfb38d5021e616087f53f") }');
    });
  });

  describe('when a valid ObjectId query is pasted', function () {
    it('returns a no-op with the existing query', function () {
      const query = lenientlyFixQuery(
        '{ _id: ObjectId("507f1f77bcf86cd799439011") }'
      );

      expect(query).to.equal(false);
    });
  });

  describe('when an invalid ObjectId is pasted', function () {
    it('returns a no-op with the existing query', function () {
      const queryWith25Chars = lenientlyFixQuery('{578cfb38d5021e616087f53f1}');
      expect(queryWith25Chars).to.equal(false);

      const queryWithObjectIdNoBraces = lenientlyFixQuery(
        '578cfb38d5021e616087f53f1'
      );
      expect(queryWithObjectIdNoBraces).to.equal(false);

      const pineappleQuery = lenientlyFixQuery('{pineapple}');
      expect(pineappleQuery).to.equal(false);
    });
  });
});
