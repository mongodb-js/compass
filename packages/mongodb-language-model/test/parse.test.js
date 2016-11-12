var parse = require('../').parse;
var pegjs = require('pegjs');
var assert = require('assert');

describe('parse', function() {
  it('should be a function', function() {
    assert.equal(typeof parse, 'function');
  });

  it('should return AST of a simple valid query', function() {
    var ast = parse('{"foo": "bar"}');
    assert.deepEqual(ast, {
      'pos': 'expression',
      'clauses': [
        {
          'pos': 'leaf-clause',
          'key': 'foo',
          'value': {
            'pos': 'leaf-value',
            'value': 'bar'
          }
        }
      ]
    });
  });

  it('should throw a pegjs.SyntaxError on an invalid query', function() {
    assert.throws(function() {
      parse('this is not a query');
    }, pegjs.SyntaxError);
  });
});
