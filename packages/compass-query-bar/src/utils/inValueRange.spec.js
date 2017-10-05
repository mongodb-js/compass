import { inValueRange } from 'utils';
import bson from 'bson';

describe('inValueRange [Util]', function() {
  let query;

  afterEach(function() {
    query = null;
  });

  describe('equality queries', function() {
    beforeEach(function() {
      query = 15;
    });

    it('should detect a match', function() {
      expect(inValueRange(query, {value: 15, dx: 0})).to.equal('yes');
    });

    it('should detect a partial match', function() {
      expect(inValueRange(query, {value: 14, dx: 2})).to.equal('partial');
    });

    it('should detect a miss', function() {
      expect(inValueRange(query, {value: 14.99, dx: 0})).to.equal('no');
      expect(inValueRange(query, {value: 15.01, dx: 0})).to.equal('no');
    });
  });

  describe('closed ranges with $gte and $lt', function() {
    beforeEach(function() {
      query = { $gte: 15, $lt: 30 };
    });

    it('should detect a match', function() {
      expect(inValueRange(query, {value: 20, dx: 5})).to.equal('yes');
    });

    it('should detect a match at the lower bound', function() {
      expect(inValueRange(query, {value: 15, dx: 5})).to.equal('yes');
    });

    it('should detect a partial match across the upper bound', function() {
      expect(inValueRange(query, {value: 20, dx: 20})).to.equal('partial');
    });

    it('should detect a partial match across the lower bound', function() {
      expect(inValueRange(query, {value: 10, dx: 10})).to.equal('partial');
    });

    it('should detect a miss exactly at the lower bound', function() {
      expect(inValueRange(query, {value: 10, dx: 5})).to.equal('no');
    });

    it('should detect a miss exactly at the upper bound', function() {
      expect(inValueRange(query, {value: 30, dx: 5})).to.equal('no');
    });

    it('should detect a miss just below the lower bound', function() {
      expect(inValueRange(query, {value: 10, dx: 4.99})).to.equal('no');
    });

    it('should detect edge case where range wraps around both bounds', function() {
      expect(inValueRange(query, {value: 0, dx: 100})).to.equal('partial');
    });
  });

  describe('closed ranges for negative values with $gte and $lt', function() {
    beforeEach(function() {
      query = { $gte: -30, $lt: -15 };
    });

    it('should detect a match', function() {
      expect(inValueRange(query, {value: -20, dx: 5})).to.equal('yes');
    });

    it('should detect a match at the lower bound', function() {
      expect(inValueRange(query, {value: -30, dx: 5})).to.equal('yes');
    });

    it('should detect a partial match across the upper bound', function() {
      expect(inValueRange(query, {value: -20, dx: 20})).to.equal('partial');
    });

    it('should detect a partial match across the lower bound', function() {
      expect(inValueRange(query, {value: -35, dx: 10})).to.equal('partial');
    });

    it('should detect a miss exactly at the lower bound', function() {
      expect(inValueRange(query, {value: -35, dx: 5})).to.equal('no');
    });

    it('should detect a miss exactly at the upper bound', function() {
      expect(inValueRange(query, {value: -15, dx: 5})).to.equal('no');
    });

    it('should detect a miss just below the lower bound', function() {
      expect(inValueRange(query, {value: -35, dx: 4.99})).to.equal('no');
    });

    it('should detect edge case where range wraps around both bounds', function() {
      expect(inValueRange(query, {value: -100, dx: 100})).to.equal('partial');
    });
  });

  describe('open ranges with $gte', function() {
    beforeEach(function() {
      query = {$gte: 15};
    });

    it('should detect a match for a range', function() {
      expect(inValueRange(query, {value: 20, dx: 5})).to.equal('yes');
    });

    it('should detect a match for single value', function() {
      expect(inValueRange(query, {value: 20, dx: 0})).to.equal('yes');
    });

    it('should detect a match for a range, starting at the bound', function() {
      expect(inValueRange(query, {value: 15, dx: 5})).to.equal('yes');
    });

    it('should detect a miss for a range, ending at the bound', function() {
      expect(inValueRange(query, {value: 10, dx: 5})).to.equal('no');
    });

    it('should detect a match for single value at the bound', function() {
      expect(inValueRange(query, {value: 15, dx: 0})).to.equal('yes');
    });

    it('should detect a partial match for a range across the bound', function() {
      expect(inValueRange(query, {value: 12, dx: 5})).to.equal('partial');
    });

    it('should detect a miss for a range below the bound', function() {
      expect(inValueRange(query, {value: -20, dx: 5})).to.equal('no');
    });

    it('should detect a miss for a single value below the bound', function() {
      expect(inValueRange(query, {value: -20, dx: 0})).to.equal('no');
    });
  });

  describe('open ranges with $gt', function() {
    beforeEach(function() {
      query = {$gt: 15};
    });

    it('should detect a match for a range', function() {
      expect(inValueRange(query, {value: 20, dx: 5})).to.equal('yes');
    });

    it('should detect a match for single value', function() {
      expect(inValueRange(query, {value: 20, dx: 0})).to.equal('yes');
    });

    it('should detect a partial match for a range, starting at the bound', function() {
      expect(inValueRange(query, {value: 15, dx: 5})).to.equal('partial');
    });

    it('should detect a miss for single value at the bound', function() {
      expect(inValueRange(query, {value: 15, dx: 0})).to.equal('no');
    });

    it('should detect a partial match for a range across the bound', function() {
      expect(inValueRange(query, {value: 12, dx: 5})).to.equal('partial');
    });

    it('should detect a miss for a range ending at the bound', function() {
      expect(inValueRange(query, {value: 10, dx: 5})).to.equal('no');
    });

    it('should detect a miss for a range below the bound', function() {
      expect(inValueRange(query, {value: -20, dx: 5})).to.equal('no');
    });

    it('should detect a miss for a single value below the bound', function() {
      expect(inValueRange(query, {value: -20, dx: 0})).to.equal('no');
    });
  });

  describe('open ranges with $lte', function() {
    beforeEach(function() {
      query = {$lte: 15};
    });

    it('should detect a match for a range', function() {
      expect(inValueRange(query, {value: 5, dx: 5})).to.equal('yes');
    });

    it('should detect a match for single value', function() {
      expect(inValueRange(query, {value: 10, dx: 0})).to.equal('yes');
    });

    it('should detect a match for single value at the bound', function() {
      expect(inValueRange(query, {value: 15, dx: 0})).to.equal('yes');
    });

    it('should detect a partial match for a range across the bound', function() {
      expect(inValueRange(query, {value: 12, dx: 5})).to.equal('partial');
    });

    it('should detect a match for a range ending at the bound', function() {
      expect(inValueRange(query, {value: 10, dx: 5})).to.equal('yes');
    });

    it('should detect a partial match for a range starting at the bound', function() {
      expect(inValueRange(query, {value: 15, dx: 5})).to.equal('partial');
    });

    it('should detect a miss for a range above the bound', function() {
      expect(inValueRange(query, {value: 20, dx: 5})).to.equal('no');
    });

    it('should detect a miss for a single value above the bound', function() {
      expect(inValueRange(query, {value: 20, dx: 0})).to.equal('no');
    });
  });

  describe('open ranges with $lt', function() {
    beforeEach(function() {
      query = {$lt: 15};
    });

    it('should detect a match for a range', function() {
      expect(inValueRange(query, {value: 5, dx: 5})).to.equal('yes');
    });

    it('should detect a match for single value', function() {
      expect(inValueRange(query, {value: 10, dx: 0})).to.equal('yes');
    });

    it('should detect a miss for a range starting at the bound', function() {
      expect(inValueRange(query, {value: 15, dx: 5})).to.equal('no');
    });

    it('should detect a miss for single value at the bound', function() {
      expect(inValueRange(query, {value: 15, dx: 0})).to.equal('no');
    });

    it('should detect a partial match for a range across the bound', function() {
      expect(inValueRange(query, {value: 12, dx: 5})).to.equal('partial');
    });

    it('should detect a match for a range ending at the bound', function() {
      expect(inValueRange(query, {value: 10, dx: 5})).to.equal('yes');
    });

    it('should detect a miss for a range above the bound', function() {
      expect(inValueRange(query, {value: 20, dx: 5})).to.equal('no');
    });

    it('should detect a miss for a single value above the bound', function() {
      expect(inValueRange(query, {value: 20, dx: 0})).to.equal('no');
    });
  });

  describe('non-numeric types', function() {
    it('should work for dates', function() {
      query = {$gte: new Date('2011-01-01'), $lte: new Date('2013-01-01')};

      expect(inValueRange(query, {value: new Date('2012-01-01')})).to.equal('yes');
      expect(inValueRange(query, {value: new Date('2015-01-01')})).to.equal('no');
    });

    it('should work for objectids', function() {
      query = {
        $gte: new bson.ObjectId('578cfb38d5021e616087f53f'),
        $lte: new bson.ObjectId('578cfb42d5021e616087f541')
      };

      expect(inValueRange(query, {value: new bson.ObjectId('578cfb3ad5021e616087f540')})).to.equal('yes');
      expect(inValueRange(query, {value: new bson.ObjectId('578cfb6fd5021e616087f542')})).to.equal('no');
    });

    it('should work for $numberDecimal', function() {
      query = {
        $gte: bson.Decimal128.fromString('1.5'),
        $lte: bson.Decimal128.fromString('2.5')
      };

      expect(inValueRange(query, {value: bson.Decimal128.fromString('1.8')})).to.equal('yes');
      expect(inValueRange(query, {value: bson.Decimal128.fromString('4.4')})).to.equal('no');
    });

    it('should work for $numberDecimal with a dx of 0', function() {
      query = {
        $gte: bson.Decimal128.fromString('1.5'),
        $lte: bson.Decimal128.fromString('2.5')
      };

      expect(inValueRange(query, {value: bson.Decimal128.fromString('1.8'), dx: 0})).to.equal('yes');
      expect(inValueRange(query, {value: bson.Decimal128.fromString('4.4'), dx: 0})).to.equal('no');
    });

    it('should work for $numberDecimal with a single equality query', function() {
      query = bson.Decimal128.fromString('1.5');

      expect(inValueRange(query, {value: bson.Decimal128.fromString('1.5')})).to.equal('yes');
      expect(inValueRange(query, {value: bson.Decimal128.fromString('1.6')})).to.equal('no');
    });

    it('should work for $numberDecimal with a single equality query and dx of 0', function() {
      query = bson.Decimal128.fromString('1.5');

      expect(inValueRange(query, {value: bson.Decimal128.fromString('1.5'), dx: 0})).to.equal('yes');
      expect(inValueRange(query, {value: bson.Decimal128.fromString('1.6'), dx: 0})).to.equal('no');
    });
  });

  describe('special edge cases', function() {
    it('should detect a miss exactly at the lower bound for very large numbers', function() {
      query = {$gte: 10000000000, $lt: 10100000000};

      expect(inValueRange(query, {value: 9900000000, dx: 100000000})).to.equal('no');
    });
  });
});
