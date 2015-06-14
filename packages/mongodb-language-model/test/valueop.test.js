var models = require('../models');
var assert = require('assert');
var _ = require('lodash');


describe('ValueOperator', function() {
  var valueop;

  beforeEach(function() {
    valueop = new models.ValueOperator();
  });

  it('should be an instance of Operator', function() {
    assert.ok(valueop instanceof models.Operator);
  });

  it('should initially have empty operator string and null value', function() {
    assert.ok(valueop);
    assert.equal(valueop.operator, '');
    assert.equal(valueop.value.serialize(), null);
  });

  it('should only accept the defined value operators', function() {
    var valueOperators = models.definitions.valueOperators;
    _.each(valueOperators, function(op) {
      valueop.set('operator', op);
      assert.ok(valueop);
    });

    var listOperators = models.definitions.listOperators;
    var treeOperators = models.definitions.treeOperators;
    var otherOperators = ['$foo', '$bar', '$baz'];
    var badOperators = [].concat(listOperators, treeOperators, otherOperators);

    _.each(badOperators, function(op) {
      assert.throws(function() {
        valueop.set('operator', op);
      }, TypeError);
    });
  });

  it('should construct the buffer correctly from operator and value', function() {
    var input = {
      $ne: 'foo'
    };
    valueop = new models.ValueOperator(input, {
      parse: true
    });
    assert.deepEqual(valueop.buffer, input);
  });

  it('should work with null-ish values', function() {
    valueop = new models.ValueOperator({
      $ne: null
    }, {
      parse: true
    });
    assert.equal(valueop.value.type, 'null');
    assert.equal(valueop.value.content, null);

    valueop = new models.ValueOperator({
      $ne: false
    }, {
      parse: true
    });
    assert.equal(valueop.value.type, 'boolean');
    assert.equal(valueop.value.content, false);
  });

  it('should serialize to the original input', function() {
    var input = {
      $ne: 'foo'
    };
    valueop = new models.ValueOperator(input, {
      parse: true
    });
    assert.deepEqual(valueop.serialize(), input);
  });

  it('should have its parent property point to the correct parent', function() {
    // parent is clause
    var clause = new models.LeafClause({
      foo: {
        $ne: 3
      }
    }, {
      parse: true
    });

    assert.equal(clause.value.parent, clause);

    // parent is OperatorObject
    var opob = new models.OperatorObject({
      $gt: 4,
      $lt: 10
    }, {
      parse: true
    });
    opob.operators.forEach(function(valueop) {
      assert.equal(valueop.parent, opob);
    });
  });

  it('should be valid by default', function() {
    // value is always valid
    assert.ok(valueop.valid);
  });

  it('should have the correct className property', function() {
    assert.equal(valueop.className, 'ValueOperator');
  });

  it('should pass buffer:change events to its parent', function(done) {
    var input = {
      $ne: 'foo'
    };
    valueop = new models.ValueOperator(input, {
      parse: true
    });
    valueop.on('change:buffer', function() {
      done();
    });
    valueop.value.content = 'bar';
  });
});
