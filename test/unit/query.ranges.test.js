/* eslint no-var: 0 */
var inValueRange = require('../../src/internal-plugins/query/lib/util').inValueRange;
var assert = require('assert');
var bson = require('bson');

describe('inValueRange', function() {
  describe('equality queries', function() {
    var query;
    beforeEach(function() {
      query = 15;
    });
    it('should detect a match', function() {
      assert.equal(inValueRange(query, {value: 15, dx: 0}), 'yes');
    });
    it('should detect a partial match', function() {
      assert.equal(inValueRange(query, {value: 14, dx: 2}), 'partial');
    });
    it('should detect a miss', function() {
      assert.equal(inValueRange(query, {value: 14.99, dx: 0}), 'no');
      assert.equal(inValueRange(query, {value: 15.01, dx: 0}), 'no');
    });
  });
  describe('closed ranges with $gte and $lt', function() {
    var query;
    beforeEach(function() {
      query = {$gte: 15, $lt: 30};
    });
    it('should detect a match', function() {
      assert.equal(inValueRange(query, {value: 20, dx: 5}), 'yes');
    });
    it('should detect a match at the lower bound', function() {
      assert.equal(inValueRange(query, {value: 15, dx: 5}), 'yes');
    });
    it('should detect a partial match across the upper bound', function() {
      assert.equal(inValueRange(query, {value: 20, dx: 20}), 'partial');
    });
    it('should detect a partial match across the lower bound', function() {
      assert.equal(inValueRange(query, {value: 10, dx: 10}), 'partial');
    });
    it('should detect a miss exactly at the lower bound', function() {
      assert.equal(inValueRange(query, {value: 10, dx: 5}), 'no');
    });
    it('should detect a miss exactly at the upper bound', function() {
      assert.equal(inValueRange(query, {value: 30, dx: 5}), 'no');
    });
    it('should detect a miss just below the lower bound', function() {
      assert.equal(inValueRange(query, {value: 10, dx: 4.99}), 'no');
    });
    it('should detect edge case where range wraps around both bounds', function() {
      assert.equal(inValueRange(query, {value: 0, dx: 100}), 'partial');
    });
  });

  describe('closed ranges for negative values with $gte and $lt', function() {
    var query;
    beforeEach(function() {
      query = {$gte: -30, $lt: -15};
    });
    it('should detect a match', function() {
      assert.equal(inValueRange(query, {value: -20, dx: 5}), 'yes');
    });
    it('should detect a match at the lower bound', function() {
      assert.equal(inValueRange(query, {value: -30, dx: 5}), 'yes');
    });
    it('should detect a partial match across the upper bound', function() {
      assert.equal(inValueRange(query, {value: -20, dx: 20}), 'partial');
    });
    it('should detect a partial match across the lower bound', function() {
      assert.equal(inValueRange(query, {value: -35, dx: 10}), 'partial');
    });
    it('should detect a miss exactly at the lower bound', function() {
      assert.equal(inValueRange(query, {value: -35, dx: 5}), 'no');
    });
    it('should detect a miss exactly at the upper bound', function() {
      assert.equal(inValueRange(query, {value: -15, dx: 5}), 'no');
    });
    it('should detect a miss just below the lower bound', function() {
      assert.equal(inValueRange(query, {value: -35, dx: 4.99}), 'no');
    });
    it('should detect edge case where range wraps around both bounds', function() {
      assert.equal(inValueRange(query, {value: -100, dx: 100}), 'partial');
    });
  });


  describe('open ranges with $gte', function() {
    var query;
    beforeEach(function() {
      query = {$gte: 15};
    });
    it('should detect a match for a range', function() {
      assert.equal(inValueRange(query, {value: 20, dx: 5}), 'yes');
    });
    it('should detect a match for single value', function() {
      assert.equal(inValueRange(query, {value: 20, dx: 0}), 'yes');
    });
    it('should detect a match for a range, starting at the bound', function() {
      assert.equal(inValueRange(query, {value: 15, dx: 5}), 'yes');
    });
    it('should detect a miss for a range, ending at the bound', function() {
      assert.equal(inValueRange(query, {value: 10, dx: 5}), 'no');
    });
    it('should detect a match for single value at the bound', function() {
      assert.equal(inValueRange(query, {value: 15, dx: 0}), 'yes');
    });
    it('should detect a partial match for a range across the bound', function() {
      assert.equal(inValueRange(query, {value: 12, dx: 5}), 'partial');
    });
    it('should detect a miss for a range below the bound', function() {
      assert.equal(inValueRange(query, {value: -20, dx: 5}), 'no');
    });
    it('should detect a miss for a single value below the bound', function() {
      assert.equal(inValueRange(query, {value: -20, dx: 0}), 'no');
    });
  });
  describe('open ranges with $gt', function() {
    var query;
    beforeEach(function() {
      query = {$gt: 15};
    });
    it('should detect a match for a range', function() {
      assert.equal(inValueRange(query, {value: 20, dx: 5}), 'yes');
    });
    it('should detect a match for single value', function() {
      assert.equal(inValueRange(query, {value: 20, dx: 0}), 'yes');
    });
    it('should detect a partial match for a range, starting at the bound', function() {
      assert.equal(inValueRange(query, {value: 15, dx: 5}), 'partial');
    });
    it('should detect a miss for single value at the bound', function() {
      assert.equal(inValueRange(query, {value: 15, dx: 0}), 'no');
    });
    it('should detect a partial match for a range across the bound', function() {
      assert.equal(inValueRange(query, {value: 12, dx: 5}), 'partial');
    });
    it('should detect a miss for a range ending at the bound', function() {
      assert.equal(inValueRange(query, {value: 10, dx: 5}), 'no');
    });
    it('should detect a miss for a range below the bound', function() {
      assert.equal(inValueRange(query, {value: -20, dx: 5}), 'no');
    });
    it('should detect a miss for a single value below the bound', function() {
      assert.equal(inValueRange(query, {value: -20, dx: 0}), 'no');
    });
  });
  describe('open ranges with $lte', function() {
    var query;
    beforeEach(function() {
      query = {$lte: 15};
    });
    it('should detect a match for a range', function() {
      assert.equal(inValueRange(query, {value: 5, dx: 5}), 'yes');
    });
    it('should detect a match for single value', function() {
      assert.equal(inValueRange(query, {value: 10, dx: 0}), 'yes');
    });
    it('should detect a match for single value at the bound', function() {
      assert.equal(inValueRange(query, {value: 15, dx: 0}), 'yes');
    });
    it('should detect a partial match for a range across the bound', function() {
      assert.equal(inValueRange(query, {value: 12, dx: 5}), 'partial');
    });
    it('should detect a match for a range ending at the bound', function() {
      assert.equal(inValueRange(query, {value: 10, dx: 5}), 'yes');
    });
    it('should detect a partial match for a range starting at the bound', function() {
      assert.equal(inValueRange(query, {value: 15, dx: 5}), 'partial');
    });
    it('should detect a miss for a range above the bound', function() {
      assert.equal(inValueRange(query, {value: 20, dx: 5}), 'no');
    });
    it('should detect a miss for a single value above the bound', function() {
      assert.equal(inValueRange(query, {value: 20, dx: 0}), 'no');
    });
  });
  describe('open ranges with $lt', function() {
    var query;
    beforeEach(function() {
      query = {$lt: 15};
    });
    it('should detect a match for a range', function() {
      assert.equal(inValueRange(query, {value: 5, dx: 5}), 'yes');
    });
    it('should detect a match for single value', function() {
      assert.equal(inValueRange(query, {value: 10, dx: 0}), 'yes');
    });
    it('should detect a miss for a range starting at the bound', function() {
      assert.equal(inValueRange(query, {value: 15, dx: 5}), 'no');
    });
    it('should detect a miss for single value at the bound', function() {
      assert.equal(inValueRange(query, {value: 15, dx: 0}), 'no');
    });
    it('should detect a partial match for a range across the bound', function() {
      assert.equal(inValueRange(query, {value: 12, dx: 5}), 'partial');
    });
    it('should detect a match for a range ending at the bound', function() {
      assert.equal(inValueRange(query, {value: 10, dx: 5}), 'yes');
    });
    it('should detect a miss for a range above the bound', function() {
      assert.equal(inValueRange(query, {value: 20, dx: 5}), 'no');
    });
    it('should detect a miss for a single value above the bound', function() {
      assert.equal(inValueRange(query, {value: 20, dx: 0}), 'no');
    });
  });

  describe('non-numeric types', function() {
    it('should work for dates', function() {
      var query = {$gte: new Date('2011-01-01'), $lte: new Date('2013-01-01')};
      assert.equal(inValueRange(query, {value: new Date('2012-01-01')}), 'yes');
      assert.equal(inValueRange(query, {value: new Date('2015-01-01')}), 'no');
    });
    it('should work for objectids', function() {
      var query = {
        $gte: new bson.ObjectId('578cfb38d5021e616087f53f'),
        $lte: new bson.ObjectId('578cfb42d5021e616087f541')
      };
      assert.equal(inValueRange(query, {value: new bson.ObjectId('578cfb3ad5021e616087f540')}), 'yes');
      assert.equal(inValueRange(query, {value: new bson.ObjectId('578cfb6fd5021e616087f542')}), 'no');
    });
    it('should work for $numberDecimal', function() {
      var query = {
        $gte: bson.Decimal128.fromString('1.5'),
        $lte: bson.Decimal128.fromString('2.5')
      };
      assert.equal(inValueRange(query, {value: bson.Decimal128.fromString('1.8')}), 'yes');
      assert.equal(inValueRange(query, {value: bson.Decimal128.fromString('4.4')}), 'no');
    });
    it('should work for $numberDecimal with a dx of 0', function() {
      var query = {
        $gte: bson.Decimal128.fromString('1.5'),
        $lte: bson.Decimal128.fromString('2.5')
      };
      assert.equal(inValueRange(query, {value: bson.Decimal128.fromString('1.8'), dx: 0}), 'yes');
      assert.equal(inValueRange(query, {value: bson.Decimal128.fromString('4.4'), dx: 0}), 'no');
    });
    it('should work for $numberDecimal with a single equality query', function() {
      var query = bson.Decimal128.fromString('1.5');
      assert.equal(inValueRange(query, {value: bson.Decimal128.fromString('1.5')} ), 'yes');
      assert.equal(inValueRange(query, {value: bson.Decimal128.fromString('1.6')} ), 'no');
    });
    it('should work for $numberDecimal with a single equality query and dx of 0', function() {
      var query = bson.Decimal128.fromString('1.5');
      assert.equal(inValueRange(query, {value: bson.Decimal128.fromString('1.5'), dx: 0} ), 'yes');
      assert.equal(inValueRange(query, {value: bson.Decimal128.fromString('1.6'), dx: 0} ), 'no');
    });
  });

  describe('special edge cases', function() {
    it('should detect a miss exactly at the lower bound for very large numbers', function() {
      var query = {$gte: 10000000000, $lt: 10100000000};
      assert.equal(inValueRange(query, {value: 9900000000, dx: 100000000}), 'no');
    });
  });
});
