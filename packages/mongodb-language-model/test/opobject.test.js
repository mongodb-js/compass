var models = require('../models');
var assert = require('assert');
var _ = require('lodash');


describe('OperatorObject', function() {
  var opob;

  beforeEach(function() {
    opob = new models.OperatorObject();
  });

  it('should initially have 0 operators and serialize to {}', function() {
    assert.ok(opob);
    assert.equal(opob.operators.length, 0);
    assert.deepEqual(opob.serialize(), {});
  });

  it('should be an instance of Value', function() {
    assert.ok(opob instanceof models.Value);
  });

  it('should work with list and value operators and mixed', function() {
    opob = new models.OperatorObject({
      $gt: 5,
      $lt: 9
    }, {
      parse: true
    });
    assert.ok(opob.operators.at(0) instanceof ValueOperator);
    assert.ok(opob.operators.at(1) instanceof ValueOperator);

    opob = new models.OperatorObject({
      $in: [1, 2, 3],
      $nin: [2, 6, 7]
    }, {
      parse: true
    });
    assert.ok(opob.operators.at(0) instanceof ListOperator);
    assert.ok(opob.operators.at(1) instanceof ListOperator);

    opob = new models.OperatorObject({
      $gt: 5,
      $in: ['foo', 'bar']
    }, {
      parse: true
    });
    assert.ok(opob.operators.at(0) instanceof ValueOperator);
    assert.ok(opob.operators.at(1) instanceof ListOperator);
  });

  it('should accept a single operator', function() {
    opob = new models.OperatorObject({
      $ne: null
    }, {
      parse: true
    });
    assert.equal(opob.operators.length, 1);
  });

  it('should merge same operators', function() {
    opob = new models.OperatorObject({
      $ne: null,
      $ne: true
    }, {
      parse: true
    });
    assert.equal(opob.operators.length, 1);
    assert.equal(opob.operators.at(0).operator, '$ne');
  });

  it('should serialize to the original input', function() {
    var input = {
      $gte: 5,
      $in: [6, 9, 7, 5]
    };
    opob = new models.OperatorObject(input, {
      parse: true
    });
    assert.deepEqual(opob.serialize(), input);
  });

  it('should have its parent property point to the clause', function() {
    var clause = new models.LeafClause({
      foo: {
        $in: [1, 2, 3]
      }
    }, {
      parse: true
    });
    assert.equal(clause.value.parent, clause);
  });

  it('should have the correct className property', function() {
    assert.equal(opob.className, 'OperatorObject');
  });

  it('should pass ValueOperator buffer:change events to its parent', function(done) {
    opob = new models.OperatorObject({
      $gt: 5,
      $lt: 9
    }, {
      parse: true
    });
    opob.on('change:buffer', function() {
      done();
    });
    opob.operators.at(0).value.content = 3;
  });

  it('should pass ListOperator buffer:change events to its parent', function(done) {
    opob = new models.OperatorObject({
      $in: [1, 2, 3],
      $lt: 9
    }, {
      parse: true
    });
    opob.on('change:buffer', function() {
      done();
    });
    opob.operators.at(0).values.at(1).content = 5;
  });

  it('should trigger buffer:change event when adding or removing operators', function(done) {
    opob = new models.OperatorObject({
      $in: [1, 2, 3]
    }, {
      parse: true
    });
    opob.on('change:buffer', function() {
      done();
    });
    opob.operators.add(new models.ValueOperator({
      $lt: 9
    }, {
      parse: true
    }));
  });
});
