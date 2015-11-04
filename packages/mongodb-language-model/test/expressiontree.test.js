var models = require('../models');
var assert = require('assert');


describe('ExpressionTree', function() {
  var input;
  var outerExpr;
  var tree;
  var innerExpr0;
  var innerExpr1;

  beforeEach(function() {
    input = {
      $or: [{
        foo: 1
      }, {
        bar: false
      }]
    };
    outerExpr = new models.Expression(input, {
      parse: true
    });
    tree = outerExpr.clauses.at(0);
    innerExpr0 = tree.expressions.at(0);
    innerExpr1 = tree.expressions.at(1);
  });

  it('should parse an expression tree correctly', function() {
    assert.equal(tree.operator, '$or');
    tree.expressions.forEach(function(e) {
      assert.ok(e instanceof models.Expression);
    });
    assert.deepEqual(tree.serialize(), input);
    assert.deepEqual(outerExpr.serialize(), input);
  });

  it('should parse nested expression trees correctly', function() {
    input = {
      $and: [{
        $or: [{
          foo: 1
        }, {
          bar: false
        }]
      }, {
        c: 1
      }]
    };
    outerExpr = new models.Expression(input, {
      parse: true
    });
    // outer tree operator
    tree = outerExpr.clauses.at(0);
    assert.equal(tree.operator, '$and');

    tree.expressions.forEach(function(expr) {
      assert.ok(expr instanceof models.Expression);
    });
    assert.equal(tree.operator, '$and');
    assert.deepEqual(outerExpr.serialize(), input);
    assert.deepEqual(outerExpr.buffer, input);
  });

  it('should set parent on Expression and ExpressionTree correctly', function() {
    assert.equal(innerExpr0.parent, tree);
    assert.equal(innerExpr1.parent, tree);
    assert.equal(tree.parent, outerExpr);
  });

  it('should trigger a change:buffer event when a expression buffer changes', function(done) {
    tree.on('change:buffer', function() {
      done();
    });
    innerExpr0.clauses.at(0).key.content = 'changed';
  });

  it('should trigger a change:buffer when an expression is added', function(done) {
    outerExpr.on('change:buffer', function() {
      done();
    });
    tree.expressions.add({
      thing: false
    });
  });

  it('should trigger a change:buffer when a clause is added inside an expression', function(done) {
    outerExpr.on('change:buffer', function() {
      done();
    });
    innerExpr0.clauses.add({
      thing: false
    });
  });

  it('should be an instance of Clause', function() {
    assert.ok(tree instanceof models.Clause);
  });
});
