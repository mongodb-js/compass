var Query = require('../').Query;
var assert = require('assert');

describe('Demo', function() {
  describe('Query example with 2 different top-level clauses', function () {
    var query;

    beforeEach(function() {
      query = new Query({
        'foo': 12345,
        '$and': [
          { bar: false },
          { baz: 'hello' }
        ]
      }, {parse: true});
    });

    it('should have 2 top-level clauses', function() {
      assert.equal(query.clauses.length, 2);
    });

    it('should provide access to leaf clause', function() {
      // clauses can be accessed by their key
      var leafClause = query.clauses.get('foo');

      assert.equal(leafClause.className, 'LeafClause');

      // LeafClause provides access to key and value objects. To access the
      // their native values, they need to be serialized
      assert.equal(leafClause.key.serialize(), 'foo');
      assert.equal(leafClause.value.serialize(), 12345);
    });

    it('should provide access to $and expression tree', function() {
      var exprTree = query.clauses.get('$and');
      assert.equal(exprTree.className, 'ExpressionTree');

      // get the list of clause keys
      var keys = exprTree.expressions.map(function (expr) {
        return expr.clauses.at(0).key.serialize();
      });
      assert.deepEqual(keys, ['bar', 'baz']);

      // get the list of clause values
      var values = exprTree.expressions.map(function (expr) {
        return expr.clauses.at(0).value.serialize();
      });
      assert.deepEqual(values, [false, 'hello']);
    });
  });
});
