# mongodb-language-model

[![build status](https://secure.travis-ci.org/mongodb-js/mongodb-language-model.png)](http://travis-ci.org/mongodb-js/mongodb-language-model)

Parses a MongoDB query and creates hierarchical [Ampersand.js](http://ampersandjs.com/) models for each of the language components, which can then be interacted with programmatically. 

## UML diagram

This is the hierarchical model that is created when a query is parsed:

![](./docs/query_language_uml.png)

## Example

```javascript
var Query = require('mongodb-language-model').Query;
var assert = require('assert');

// you need to specify `{parse: true}` if a raw javascript object is provided
var query = new Query(
    {"foo": 12345, "$and": [ {bar: false}, {baz: "hello"} ] }, 
    {parse: true}
);

// two top-level clauses
assert.equal(query.clauses.length, 2);

// access leaf clause
var leafClause = query.clauses.get('foo');
assert.equal(leafClause.className, 'LeafClause');

// LeafClause provides access to key and value objects. To access the their 
// native values, they need to be serialized.
assert.equal(leafClause.key.serialize(), 'foo');
assert.equal(leafClause.value.serialize(), 12345);

// access the $and expression tree
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
})
assert.deepEqual(values, [false, 'hello']);
```

## Installation

```
// @todo
npm install --save mongodb-language-model
```

## Testing

```
npm test
```

## License

Apache 2.0
