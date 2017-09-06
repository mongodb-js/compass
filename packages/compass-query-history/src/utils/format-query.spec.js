import bson from 'bson';
import { formatQuery } from 'utils';

describe('formatQuery [Utils]', () => {
  describe('when the value is a number', () => {
    it('returns the number as a string', () => {
      expect(formatQuery(10)).to.equal('10');
    });
  });

  describe('when the property has an ObjectId', () => {
    const value = new bson.ObjectId();
    const filter = { _id: value };
    const expected = `{\n _id: ObjectId('${value.toHexString()}')\n}`;

    it('returns the shell syntax string', () => {
      expect(formatQuery(filter)).to.equal(expected);
    });
  });

  describe('when the property has a date', () => {
    const value = new Date();
    const filter = { field: value };
    const expected = `{\n field: BSONDate('${value.toISOString()}')\n}`;

    it('returns the shell syntax string', () => {
      expect(formatQuery(filter)).to.equal(expected);
    });
  });

  describe('when the property has a binary', () => {
    const value = new bson.Binary('xxxx');
    const filter = { field: value };
    const expected = `{\n field: Binary('${value.buffer.toString('base64')}', '0')\n}`;

    it('returns the shell syntax string', () => {
      expect(formatQuery(filter)).to.equal(expected);
    });
  });

  describe('when the property has a MaxKey', () => {
    const value = new bson.MaxKey();
    const filter = { field: value };
    const expected = '{\n field: MaxKey()\n}';

    it('returns the shell syntax string', () => {
      expect(formatQuery(filter)).to.equal(expected);
    });
  });

  describe('when the property has a MinKey', () => {
    const value = new bson.MinKey();
    const filter = { field: value };
    const expected = '{\n field: MinKey()\n}';

    it('returns the shell syntax string', () => {
      expect(formatQuery(filter)).to.equal(expected);
    });
  });

  describe('when the property has a Decimal128', () => {
    const value = new bson.Decimal128('0.00');
    const filter = { field: value };
    const expected = '{\n field: NumberDecimal(\'0E-6176\')\n}';

    it('returns the shell syntax string', () => {
      expect(formatQuery(filter)).to.equal(expected);
    });
  });

  describe('when the property has a Long', () => {
    const value = bson.Long.fromNumber(1);
    const filter = { field: value };
    const expected = '{\n field: NumberLong(1)\n}';

    it('returns the shell syntax string', () => {
      expect(formatQuery(filter)).to.equal(expected);
    });
  });

  describe('when the property has a Regexp', () => {
    const value = /test/i;
    const filter = { field: value };
    const expected = '{\n field: RegExp(\'test\', i)\n}';

    it('returns the shell syntax string', () => {
      expect(formatQuery(filter)).to.equal(expected);
    });
  });

  describe('when the property has a Timestamp', () => {
    const value = new bson.Timestamp(1000);
    const filter = { field: value };
    const expected = '{\n field: Timestamp(1000, 0)\n}';

    it('returns the shell syntax string', () => {
      expect(formatQuery(filter)).to.equal(expected);
    });
  });
});
