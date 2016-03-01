var shared = require('../src/app/minicharts/d3fns/shared');
var _ = require('lodash');
var assert = require('assert');

function triples(v) {
  return [v, v / 2, 0];
}
describe('Minicharts', function() {
  describe('shared components', function() {
    it('should return percentages for top, middle and bottom scale correctly', function() {
      assert.deepEqual(_.map(triples(209), function(x) {
        return shared.friendlyPercentFormat(209)(x, true);
      }), ['209%', '104.5%', '0%']);
      assert.deepEqual(_.map(triples(200), function(x) {
        return shared.friendlyPercentFormat(200)(x, true);
      }), ['200%', '100%', '0%']);
      assert.deepEqual(_.map(triples(100), function(x) {
        return shared.friendlyPercentFormat(100)(x, true);
      }), ['100%', '50%', '0%']);
      assert.deepEqual(_.map(triples(99.5), function(x) {
        return shared.friendlyPercentFormat(99.5)(x, true);
      }), ['100%', '50%', '0%']);
      assert.deepEqual(_.map(triples(99.0), function(x) {
        return shared.friendlyPercentFormat(99.0)(x, true);
      }), ['99%', '49.5%', '0%']);
      assert.deepEqual(_.map(triples(99.00001), function(x) {
        return shared.friendlyPercentFormat(99.00001)(x, true);
      }), ['99%', '49.5%', '0%']);
      assert.deepEqual(_.map(triples(49.936), function(x) {
        return shared.friendlyPercentFormat(49.936)(x, true);
      }), ['50%', '25%', '0%']);
      assert.deepEqual(_.map(triples(1.1), function(x) {
        return shared.friendlyPercentFormat(1.1)(x, true);
      }), ['1%', '0.5%', '0%']);
      assert.deepEqual(_.map(triples(0.9), function(x) {
        return shared.friendlyPercentFormat(0.9)(x, true);
      }), ['0.9%', '0.45%', '0%']);
      assert.deepEqual(_.map(triples(0.4), function(x) {
        return shared.friendlyPercentFormat(0.4)(x, true);
      }), ['0.4%', '0.2%', '0%']);
      assert.deepEqual(_.map(triples(0.003), function(x) {
        return shared.friendlyPercentFormat(0.003)(x, true);
      }), ['0.003%', '0.0015%', '0%']);
      assert.deepEqual(_.map(triples(0), function(x) {
        return shared.friendlyPercentFormat(0)(x, true);
      }), ['0%', '0%', '0%']);
      assert.deepEqual(_.map(triples(-1.5), function(x) {
        return shared.friendlyPercentFormat(-1.5)(x, true);
      }), ['-2%', '-1%', '0%']);
    });
  });
});
