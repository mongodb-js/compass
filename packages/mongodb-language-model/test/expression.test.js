var models = require('../models');
var assert = require('assert');
var _ = require('lodash');


describe('Expression', function() {
  var expr;

  beforeEach(function() {
    expr = new models.Expression();
  });

  it('should start with an empty clause collection', function() {
    assert.equal(expr.clauses.length, 0);
  });

  it('should have a valid {} clause initially', function() {
    assert.ok(expr.valid);
    assert.deepEqual(expr.buffer, {});
  });

  it('should parse an initial query of simple values correctly', function() {
    var query = {
      num: 13,
      str: 'foo',
      bool: true
    };
    var expr = new models.Expression(query, {
      parse: true
    });

    assert.equal(expr.clauses.length, 3);
    expr.clauses.forEach(function(clause) {
      assert.ok(clause instanceof models.LeafClause);
    });
    assert.deepEqual(expr.clauses.at(0).buffer, {
      bool: true
    });
    assert.deepEqual(expr.clauses.at(1).buffer, {
      num: 13
    });
    assert.deepEqual(expr.clauses.at(2).buffer, {
      str: 'foo'
    });
    assert.equal(expr.clauses.at(1).key.buffer, 'num');
    assert.equal(expr.clauses.at(1).value.buffer, 13);
    assert.equal(expr.clauses.at(1).value.type, 'number');
  });

  it('should parse and serialize complex queries with operators', function() {
    var query = {
      a: 1,
      b: {
        x: 3
      },
      c: {
        $ne: 5
      },
      d: {
        $in: [1, 2, 3]
      },
      e: {
        $gt: 5,
        $lt: 9
      }
    };
    expr = new models.Expression(query, {
      parse: true
    });
    assert.deepEqual(expr.serialize(), query);
  });

  it('should serialize to the original input', function() {
    var input = {
      num: 13,
      str: 'foo',
      bool: true
    };
    expr = new models.Expression(input, {
      parse: true
    });
    assert.deepEqual(expr.serialize(), input);

  });

  it('should trigger a change:buffer event when adding/removing a clause', function(done) {
    var counter = 0;
    var expr = new models.Expression([], {
      parse: true
    });
    expr.on('change:buffer', function() {
      assert.ok(true);
      counter++;
      if (counter === 2) {
        done();
      }
    });
    var clause = expr.clauses.add({
      foo: 1
    });
    expr.clauses.remove(clause);
  });

  it('shoud trigger a change:buffer event when resetting the clause collection', function(done) {
    var expr = new models.Expression([{foo: 1}, {bar: 2}], {
      parse: true
    });
    expr.on('change:buffer', _.once(done));
    expr.clauses.reset([{baz: 2}, {booze: 5}]);
  });

  it('shoud trigger a change:buffer event when adding a clause', function(done) {
    var expr = new models.Expression([{foo: 1}, {bar: 2}], {
      parse: true
    });
    expr.on('change:buffer', done);
    expr.clauses.add(new models.LeafClause({baz: 4}, {parse: true}));
  });

  it('should trigger a change:buffer event when a child buffer changes', function(done) {
    expr.clauses.add({
      bar: 1
    });
    var key = expr.clauses.at(0).key;
    expr.on('change:buffer', function() {
      done();
    });
    key.content = 'foo';
  });

  it('should become valid when child buffers become valid', function(done) {
    expr = new models.Expression({
      foo: 1
    }, {
      parse: true,
    });
    var value = expr.clauses.at(0).value;
    expr.on('change:valid', function() {
      assert.ok(expr.valid);
      done();
    });
    value.content = 'i\'m a string';
  });

  it('should support multiple clauses', function() {
    for (var i = 0; i < 10; i++) {
      var doc = {};
      doc['key' + i] = 'foo';
      var c = expr.clauses.add(doc);
    }
    assert.equal(expr.clauses.length, 10);
  });

  it('should return an object of clauses as buffer', function() {
    var c1 = expr.clauses.add({
      foo: 'bar'
    });
    var c2 = expr.clauses.add({
      counter: 159
    });

    assert.deepEqual(expr.buffer, _.assign(c1.buffer, c2.buffer));
    assert.deepEqual(expr.buffer, {
      'foo': 'bar',
      'counter': 159
    });
  });

  it('should have the correct className property', function() {
    assert.equal(expr.className, 'Expression');
  });

  it('should allow access to clauses via their idAttribute (id)', function() {
    var input = {
      'myfield': 13,
      '$and': [{
        foo: 1
      }, {
        bar: 1
      }]
    };
    expr = new models.Expression(input, {
      parse: true
    });

    assert.equal(expr.clauses.get('myfield').className, 'LeafClause');
    assert.equal(expr.clauses.get('$and').className, 'ExpressionTree');
  });
});
