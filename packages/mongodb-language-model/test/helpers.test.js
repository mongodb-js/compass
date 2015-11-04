var models = require('../models');
var assert = require('assert');

// range query
describe('Helpers', function() {
  var helpers = models.helpers;
  var range;

  describe('Range', function() {
    it('should support convenient initialization with `Range(upper, lower)`', function() {
      range = new helpers.Range(3, 6);
      assert.deepEqual(range.serialize(), {
        '$gte': 3,
        '$lt': 6
      });
    });

    it('should support upper inclusive ranges with `Range(upper, lower, true)', function() {
      range = new helpers.Range(3, 6, true);
      assert.deepEqual(range.serialize(), {
        '$gte': 3,
        '$lte': 6
      });
    });

    it('should support open ranges with `Range(lower)` and `Range(undefined, upper)`', function() {
      range = new helpers.Range(3);
      assert.deepEqual(range.serialize(), {
        '$gte': 3
      });

      range = new helpers.Range(undefined, 6);
      assert.deepEqual(range.serialize(), {
        '$lt': 6
      });
    });

    it('should work in combination with upper inclusive and open range', function() {
      range = new helpers.Range(undefined, 6, true);
      assert.deepEqual(range.serialize(), {
        '$lte': 6
      });
    });

    it('should have properties to return the values of upper and lower', function() {
      range = new helpers.Range(3, 6);
      assert.equal(range.lower, 3);
      assert.equal(range.upper, 6);
      assert.equal(range.isUpperInclusive, false);
    });

    it('should have upper/lower properties to change the bounds', function() {
      range = new helpers.Range(3, 6);
      range.lower = 2;
      assert.equal(range.lowerOp.value.buffer, 2);
      assert.deepEqual(range.serialize(), {
        '$gte': 2,
        '$lt': 6
      });
      range.upper = 'foo';
      assert.equal(range.upper, 'foo');
      assert.deepEqual(range.serialize(), {
        '$gte': 2,
        '$lt': 'foo'
      });
    });

    it('should notify me of lower bound changes when I listen to them', function(done) {
      range = new helpers.Range(3, 6);
      range.on('change:lower', done);
      range.lower = 2;
      range.lower = 2;
    });

    it('should notify me of upper bound changes when I listen to them', function(done) {
      range = new helpers.Range(3, 6);
      range.on('change:upper', done);
      range.upper = 6;
      range.upper = 8;
    });

    it('should be possible to go from a closed to an open lower range and back', function() {
      range = new helpers.Range(3, 6, true);
      range.lower = undefined;
      assert.deepEqual(range.serialize(), {
        '$lte': 6
      });

      range.lower = -1;
      assert.deepEqual(range.serialize(), {
        '$gte': -1,
        '$lte': 6
      });
    });

    it('should be possible to go from a closed to an open upper range and back', function() {
      range = new helpers.Range(3, 6);
      range.upper = undefined;
      assert.deepEqual(range.serialize(), {
        '$gte': 3
      });

      range.upper = true;
      assert.deepEqual(range.serialize(), {
        '$gte': 3,
        '$lt': true
      });
    });

    it('should be possible to switch from inclusive to exclusive upper bound and back', function() {
      range = new helpers.Range(3, 6);
      range.isUpperInclusive = true;
      assert.equal(range.upperOp.operator, '$lte');
      range.isUpperInclusive = false;
      assert.equal(range.upperOp.operator, '$lt');
    });
  });
});
