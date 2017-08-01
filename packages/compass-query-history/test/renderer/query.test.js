const { expect } = require('chai');
const bson = require('bson');
const { format } = require('../../lib/models/query');

describe('Query', () => {
  describe('.format', () => {
    context('when the property has an ObjectId', () => {
      const value = new bson.ObjectId();
      const filter = { _id: value };
      const expected = `{_id: ObjectId('${value.toHexString()}')}`;

      it('returns the shell syntax string', () => {
        expect(format(filter)).to.equal(expected);
      });
    });

    context('when the property has a date', () => {
      const value = new Date();
      const filter = { field: value };
      const expected = `{field: BSONDate('${value.toISOString()}')}`;

      it('returns the shell syntax string', () => {
        expect(format(filter)).to.equal(expected);
      });
    });

    context('when the property has a binary', () => {
      const value = new bson.Binary('xxxx');
      const filter = { field: value };
      const expected = `{field: Binary('${value.buffer.toString('base64')}', '0')}`;

      it('returns the shell syntax string', () => {
        expect(format(filter)).to.equal(expected);
      });
    });

    context('when the property has a MaxKey', () => {
      const value = new bson.MaxKey();
      const filter = { field: value };
      const expected = '{field: MaxKey()}';

      it('returns the shell syntax string', () => {
        expect(format(filter)).to.equal(expected);
      });
    });

    context('when the property has a MinKey', () => {
      const value = new bson.MinKey();
      const filter = { field: value };
      const expected = '{field: MinKey()}';

      it('returns the shell syntax string', () => {
        expect(format(filter)).to.equal(expected);
      });
    });

    context('when the property has a Decimal128', () => {
      const value = new bson.Decimal128('0.00');
      const filter = { field: value };
      const expected = '{field: NumberDecimal(\'0E-6176\')}';

      it('returns the shell syntax string', () => {
        expect(format(filter)).to.equal(expected);
      });
    });

    context('when the property has a Long', () => {
      const value = bson.Long.fromNumber(1);
      const filter = { field: value };
      const expected = '{field: NumberLong(1)}';

      it('returns the shell syntax string', () => {
        expect(format(filter)).to.equal(expected);
      });
    });

    context('when the property has a Regexp', () => {
      const value = /test/i;
      const filter = { field: value };
      const expected = '{field: RegExp(\'test\', i)}';

      it('returns the shell syntax string', () => {
        expect(format(filter)).to.equal(expected);
      });
    });

    context('when the property has a Timestamp', () => {
      const value = new bson.Timestamp(1000);
      const filter = { field: value };
      const expected = '{field: Timestamp(1000, 0)}';

      it('returns the shell syntax string', () => {
        expect(format(filter)).to.equal(expected);
      });
    });
  });
});
