var models = require('../models');
var assert = require('assert');

describe('LeafClause', function() {
  var clause;

  beforeEach(function() {
    clause = new models.LeafClause();
  });

  it('should create a key and value', function() {
    assert.ok(clause.key instanceof models.Key);
    assert.ok(clause.value instanceof models.Value);
  });

  it('should be an instance of Clause', function() {
    assert.ok(clause instanceof models.Clause);
  });

  it('should be invalid initially due to empty key', function() {
    assert.ok(!clause.valid);
  });

  it('should pass null values down to LeafValue correctly', function() {
    clause = new models.LeafClause({
      a: null
    }, {
      parse: true
    });
    assert.equal(clause.value.content, null);
    assert.equal(clause.value.type, 'null');
  });

  it('should correctly parse key and leaf value', function() {
    clause = new models.LeafClause({
      foo: 'test'
    }, {
      parse: true
    });
    assert.equal(clause.key.content, 'foo');
    assert.equal(clause.value.content, 'test');
    assert.ok(clause.value instanceof models.LeafValue);
  });

  it('should correctly parse operators for values', function() {
    // ValueOperator
    clause = new models.LeafClause({
      foo: {
        $gt: 4
      }
    }, {
      parse: true
    });
    var valueop = clause.value.operators.at(0);
    assert.ok(valueop instanceof models.ValueOperator);
    assert.equal(valueop.value.content, 4);
    assert.equal(valueop.operator, '$gt');

    // ListOperator
    clause = new models.LeafClause({
      foo: {
        $in: [1, 'x', 3]
      }
    }, {
      parse: true
    });
    var listop = clause.value.operators.at(0);
    assert.ok(listop instanceof models.ListOperator);
    assert.deepEqual(listop.values.serialize(), [1, 'x', 3]);
    assert.equal(listop.operator, '$in');

    // OperatorObject with mixed operators
    clause = new models.LeafClause({
      foo: {
        $gt: 5,
        $nin: [8, 9]
      }
    }, {
      parse: true
    });
    assert.ok(clause.value instanceof models.OperatorObject);
    assert.ok(clause.value.operators.at(0) instanceof models.ValueOperator);
    assert.ok(clause.value.operators.at(1) instanceof models.ListOperator);
    assert.deepEqual(clause.value.serialize(), {
      $gt: 5,
      $nin: [8, 9]
    });
  });

  it('should be valid only if both key and value are valid', function() {
    clause = new models.LeafClause({
      foo: 'bar'
    }, {
      parse: true
    });
    assert.ok(clause.valid);

    // make key invalid (empty key)
    clause.key.content = '';
    assert.ok(!clause.valid);
  });

  it('should have its parent property point to the expression', function() {
    var expr = new models.Expression({
      foo: 'string',
      bar: 2
    }, {
      parse: true
    });
    expr.clauses.forEach(function(cl) {
      assert.equal(cl.parent, expr);
    });
  });

  it('should have the correct className property', function() {
    assert.equal(clause.className, 'LeafClause');
  });

  it('should pass buffer:change events from LeafValue to its parent', function(done) {
    clause = new models.LeafClause({
      foo: 4
    }, {
      parse: true
    });
    clause.on('change:buffer', function() {
      done();
    });
    clause.value.content = 3;
  });

  it('should pass buffer:change events from OperatorObject to its parent', function(done) {
    clause = new models.LeafClause({
      foo: {
        $in: [5, 6]
      }
    }, {
      parse: true
    });
    clause.on('change:buffer', function() {
      done();
    });
    clause.value.operators.add(new models.ValueOperator({
      $gt: 3
    }, {
      parse: true
    }));
  });

  it('should trigger buffer:change event if value changes to a new object', function(done) {
    clause = new models.LeafClause({
      foo: 4
    }, {
      parse: true
    });
    clause.on('change:buffer', function() {
      done();
    });
    clause.value = new models.OperatorObject({
      $gt: 4
    }, {
      parse: true
    });
  });

  it('should reattach a buffer:change event listener to new value objects', function(done) {
    clause = new models.LeafClause({
      foo: 4
    }, {
      parse: true
    });
    var count = 0;
    clause.on('change:buffer', function() {
      count++;
      if (count === 2) {
        done();
      }
    });
    clause.value = new models.LeafValue(3, {
      parse: true
    });
    clause.value.content = 4;
  });
});
