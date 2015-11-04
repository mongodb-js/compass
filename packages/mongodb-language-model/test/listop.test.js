var models = require('../models');
var assert = require('assert');
var _ = require('lodash');


describe('ListOperator', function() {
  var listop;

  beforeEach(function() {
    listop = new models.ListOperator();
  });

  it('should be an instance of Operator', function() {
    assert.ok(listop instanceof models.Operator);
  });

  it('should initially have empty operator string and [] values', function() {
    assert.ok(listop);
    assert.equal(listop.operator, '');
    assert.deepEqual(listop.values.serialize(), []);
  });

  it('should work with null and boolean values', function() {
    listop = new models.ListOperator({
      $in: ['foo', 1, null, false]
    }, {
      parse: true
    });
    assert.equal(listop.values.at(0).type, 'string');
    assert.equal(listop.values.at(1).type, 'number');
    assert.equal(listop.values.at(2).type, 'null');
    assert.equal(listop.values.at(3).type, 'boolean');
  });

  it('should only accept the defined list operators', function() {
    var listOperators = models.definitions.listOperators;
    _.each(listOperators, function(op) {
      listop.set('operator', op);
      assert.ok(listop);
    });

    var valueOperators = models.definitions.valueOperators;
    var treeOperators = models.definitions.treeOperators;
    var otherOperators = ['$foo', '$bar', '$baz'];
    var badOperators = [].concat(valueOperators, treeOperators, otherOperators);

    _.each(badOperators, function(op) {
      assert.throws(function() {
        listop.set('operator', op);
      }, TypeError);
    });
  });

  it('should throw an error if the value is not an array', function() {
    assert.throws(function() {
      /* eslint no-unused-vars: 0 */
      var invalid = new models.ListOperator({
        $in: 'foo'
      }, {
        parse: true
      });
    }, TypeError);
  });

  it('should serialize to the original input', function() {
    var input = {
      $in: ['foo', 'bar', 'baz']
    };
    listop = new models.ListOperator(input, {
      parse: true
    });
    assert.deepEqual(listop.serialize(), input);
    assert.deepEqual(listop.buffer, input);
  });

  it('should be valid iff all its children values are valid', function() {
    var clause = new models.LeafClause({
      foo: {
        $in: ['a', 'b', 'c']
      }
    }, {
      parse: true
    });
    listop = clause.value.operators.at(0);
    // all children are valid
    assert.ok(listop.valid);
  });

  it('should have its parent property point to the correct parent', function() {
    // parent is clause
    var clause = new models.LeafClause({
      foo: {
        $in: [1, 2, 3]
      }
    }, {
      parse: true
    });
    assert.equal(clause.value.parent, clause);

    // parent is OperatorObject
    var opob = new models.OperatorObject({
      $in: [1, 2, 3],
      $nin: [3, 4, 5]
    }, {
      parse: true
    });
    opob.operators.forEach(function(lo) {
      assert.equal(lo.parent, opob);
    });
  });

  it('should have the correct className property', function() {
    assert.equal(listop.className, 'ListOperator');
  });

  it('should pass buffer:change events to its parent', function(done) {
    var input = {
      $in: [1, 2, 3]
    };
    listop = new models.ListOperator(input, {
      parse: true
    });
    listop.on('change:buffer', function() {
      done();
    });
    var value = listop.values.at(0);
    value.content = 0;
  });
});
