import { expect } from 'chai';
import bson from 'bson';

import { formatQuery } from './';

describe('formatQuery [Utils]', function () {
  describe('when the value is a number', function () {
    it('returns the number as a string', function () {
      expect(formatQuery(10)).to.equal('10');
    });
  });

  describe('when the property has an ObjectId', function () {
    const value = new bson.ObjectId();
    const filter = { _id: value };
    const expected = `{\n _id: ObjectId('${value.toHexString()}')\n}`;

    it('returns the shell syntax string', function () {
      expect(formatQuery(filter)).to.equal(expected);
    });
  });

  describe('when the property has a date', function () {
    const value = new Date();
    const filter = { field: value };
    const expected = `{\n field: ISODate('${value.toISOString()}')\n}`;

    it('returns the shell syntax string', function () {
      expect(formatQuery(filter)).to.equal(expected);
    });
  });

  describe('when the property has a binary', function () {
    const value = bson.Binary.createFromBase64('xxxx');
    const filter = { field: value };
    const expected = `{\n field: BinData(0, '${value.buffer.toString(
      'base64'
    )}')\n}`;

    it('returns the shell syntax string', function () {
      expect(formatQuery(filter)).to.equal(expected);
    });
  });

  describe('when the property has a MaxKey', function () {
    const value = new bson.MaxKey();
    const filter = { field: value };
    const expected = '{\n field: MaxKey()\n}';

    it('returns the shell syntax string', function () {
      expect(formatQuery(filter)).to.equal(expected);
    });
  });

  describe('when the property has a MinKey', function () {
    const value = new bson.MinKey();
    const filter = { field: value };
    const expected = '{\n field: MinKey()\n}';

    it('returns the shell syntax string', function () {
      expect(formatQuery(filter)).to.equal(expected);
    });
  });

  describe('when the property has a Decimal128', function () {
    const value = new bson.Decimal128('0.00');
    const filter = { field: value };
    const expected = "{\n field: NumberDecimal('0.00')\n}";

    it('returns the shell syntax string', function () {
      expect(formatQuery(filter)).to.equal(expected);
    });
  });

  describe('when the property has a Long', function () {
    const value = bson.Long.fromNumber(1);
    const filter = { field: value };
    const expected = '{\n field: NumberLong(1)\n}';

    it('returns the shell syntax string', function () {
      expect(formatQuery(filter)).to.equal(expected);
    });
  });

  describe('when the property has a Regexp', function () {
    const value = /test/i;
    const filter = { field: value };
    const expected = '{\n field: RegExp("test", \'i\')\n}';

    it('returns the shell syntax string', function () {
      expect(formatQuery(filter)).to.equal(expected);
    });
  });

  describe('when the property has a Timestamp', function () {
    const value = new bson.Timestamp({ t: 1000, i: 0 });
    const filter = { field: value };
    const expected = '{\n field: Timestamp({ t: 1000, i: 0 })\n}';

    it('returns the shell syntax string', function () {
      expect(formatQuery(filter)).to.equal(expected);
    });
  });
});
