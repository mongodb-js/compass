var models = require('../models'),
    assert = require('assert'),
    _ = require('lodash');

describe('Models', function () {
    var schema;

    beforeEach(function () {
        schema = new models.Schema({
            namespace: 'foo.bar',
            raw: {
                '#count': 1,
                'foo': {
                    '#count': 1,
                    '#prob': 1.0,
                    '#type': 'string'
                }
            }
        });
    })

    describe('ChildCollection', function () {
        it('should set the model.parent property to parent of the collection', function () {
            var expr = new models.Expression({foo: 1}, {parse: true, schema: schema});
            var collection = new models.ChildCollection(null, {parent: expr, model: models.LeafValue});
            var c = collection.add({content: "foo"});
            assert.equal(c.parent, expr);
        });

        it("should pass parent's schema to its children", function () {
            var expr = new models.Expression({foo: 1}, {parse: true, schema: schema});
            assert.equal(expr.schema, schema);
            var collection = new models.ChildCollection(null, {parent: expr, model: models.LeafValue});
            var c = collection.add("foo");
            assert.equal(c.schema, schema);
        });

        it("should add listeners on children's change:buffer events to the parent", function (done) {
            var expr = new models.Expression({foo: 1}, {parse: true});
            var collection = new models.ChildCollection(null, {parent: expr, model: models.LeafValue});
            var c = collection.add("foo");
            expr.on('change:buffer', function () {
                done();
            });
            c.content = "bar";
        });

        it("should add listeners on collection's add events to the parent", function (done) {
            var expr = new models.Expression({foo: 1}, {parse: true});
            var collection = new models.ChildCollection([], {parent: expr, model: models.LeafValue});
            expr.on('change:buffer', function () {
                done();
            });
            collection.add("foo");
        });

        it("should add listeners on collection's remove events to the parent", function (done) {
            var expr = new models.Expression({foo: 1}, {parse: true});
            var collection = new models.ChildCollection(["foo"], {parent: expr, model: models.LeafValue});
            expr.on('change:buffer', function () {
                done();
            });
            collection.remove(collection.at(0));
        });
    });


    describe('Base', function() {
        var base;

        beforeEach(function () {
            base = new models.Base();
        });

        it('should initially have invalid state', function() {
            assert.equal(base.valid, false);
        });

        it('should initially have a null buffer', function() {
            assert.equal(base.buffer, null);
        });

        it('should have a null schema property', function() {
            assert.equal(base.schema, null);
        });

        it('should have the correct className property', function () {
            assert.equal(base.className, 'Base');
        });
    });

    describe('Key', function () {
        var key;
        
        beforeEach(function() {
            key = new models.Key();
        });

        it('should initially have an empty string content', function () {
            assert.equal(key.content, '');
        });

        it('should return the content via the derived buffer property', function () {
            key.content = 'foobar';
            assert.equal(key.buffer, 'foobar');
        });

        it('should serialize to the key content', function () {
            key.content = 'foobar';
            assert.equal(key.serialize(), 'foobar');
        });

        it('should be valid even if the buffer is empty or contains dot', function () {
            // empty buffer, valid
            key.content = '';
            assert.ok( key.valid );
            // . in buffer, valid
            key.content = 'foo.bar';
            assert.ok( key.valid );
            // valid example
            key.content = 'foobar';
            assert.ok( key.valid );
        });

        it('should receive the schema object from LeafClause', function() {
            var clause = new models.LeafClause({foo: "bar"}, {schema: schema, parse: true});
            assert.equal(clause.key.schema, schema);
        });

        it('should have its parent property point to the clause', function () {
            var clause = new models.LeafClause({foo: "bar"}, {schema: schema, parse: true});
            assert.equal(clause.key.parent, clause); 
        });

        it('should have the correct className property', function () {
            assert.equal(key.className, 'Key');
        });

        it('should trigger a buffer change event if key was changed', function (done) {
            key.on('change:buffer', function () {
                done();
            })

            key.content = 'changed';
        })
    });


    describe('LeafValue', function () {
        var value;

        beforeEach(function () {
            value = new models.LeafValue();
        });

        it('should be an instance of Value', function () {
            assert.ok( value instanceof models.Value );
        });

        it('should initially have a null type and null value', function () {
            assert.equal(value.type, 'null');
            assert.equal(value.content, null);
        });

        it('should be able to parse null as a value', function () {
            value = new models.LeafValue(null, {parse: true});
            assert.equal(value.type, 'null');
            assert.equal(value.content, null);
        });

        it('should always be valid without schema', function () {
            assert.ok( value.valid );
        });

        it('should only be valid if the schema type matches', function () {
            var clause = new models.LeafClause({foo: "test"}, {parse: true, schema: schema});
            assert.ok( clause.valid );

            // now change value to wrong type
            clause.value.content = 1;
            assert.ok( !clause.valid );
        });

        it('should initially have a null content', function () {
            assert.equal(value.content, null);
        });

        it('should return the content via the derived buffer property', function () {
            value.content = 'foobar';
            assert.equal(value.buffer, 'foobar');
        });      

        it('should return the content via serialize()', function () {
            value.content = 'foobar';
            assert.equal(value.serialize(), 'foobar');
        });   

        it('should return correct type based on the value', function () {
            value.content = null;
            assert.equal(value.type, 'null');

            value.content = 'foo';
            assert.equal(value.type, 'string');

            value.content = 23;
            assert.equal(value.type, 'number');

            value.content = 23.123;
            assert.equal(value.type, 'number');

            value.content = new Date(2014, 1, 1);
            assert.equal(value.type, 'date');

            value.content = [1, "foo", 3];
            assert.equal(value.type, 'array');

            value.content = {a:1, b:1};
            assert.equal(value.type, 'object');
        });

        it('should receive the schema object from LeafClause', function() {
            var clause = new models.LeafClause(null, {schema: schema});
            assert.equal(clause.key.schema, schema);
            assert.equal(clause.value.schema, schema);
        });

        it('should parse the value', function () {
            var value = new models.LeafValue("this_is_a_string", {parse: true});
            assert.equal( value.type, 'string' );
            assert.equal( value.content, 'this_is_a_string' );

            var value = new models.LeafValue(123, {parse: true});
            assert.equal( value.type, 'number' );
            assert.equal( value.content, 123 );

            var value = new models.LeafValue(null, {parse: true});
            assert.equal( value.type, 'null' );
            assert.equal( value.content, null );
        });

        it('should have its parent property point to the clause', function () {
            var clause = new models.LeafClause({foo: "bar"}, {schema: schema, parse: true});
            assert.equal(clause.value.parent, clause); 
        });

        it('should have the correct className property', function () {
            assert.equal(value.className, 'LeafValue');
        });

        it('should trigger a buffer change event if content was changed', function (done) {
            value.on('change:buffer', function () {
                done();
            });
            value.content = 'changed';
        })
    });


    describe('ValueOperator', function () {
        var valueop;

        beforeEach(function() {
            valueop = new models.ValueOperator();
        });

        it('should be an instance of Operator', function () {
            assert.ok( valueop instanceof models.Operator );
        });

        it('should initially have empty operator string and null value', function () {
            assert.ok(valueop);
            assert.equal(valueop.operator, '');
            assert.equal(valueop.value.serialize(), null);
        });

        it('should only accept the defined value operators', function () {
            var valueOperators = models.definitions.valueOperators;
            _.each(valueOperators, function (op) {
                valueop.set('operator', op);
                assert.ok(valueop);
            });

            var listOperators = models.definitions.listOperators;
            var treeOperators = models.definitions.treeOperators;
            var otherOperators = ['$foo', '$bar', '$baz'];
            var badOperators = [].concat(listOperators, treeOperators, otherOperators);
            
            _.each(badOperators, function (op) {
                assert.throws(function () { valueop.set('operator', op) }, TypeError);              
            });
        });

        it('should construct the buffer correctly from operator and value', function () {
            var input = {$ne: "foo"};
            valueop = new models.ValueOperator(input, {parse: true});
            assert.deepEqual(valueop.buffer, input);            
        });

        it('should work with null-ish values', function () {
            valueop = new models.ValueOperator({$ne: null}, {parse: true});
            assert.equal(valueop.value.type, 'null');         
            assert.equal(valueop.value.content, null); 

            valueop = new models.ValueOperator({$ne: false}, {parse: true});
            assert.equal(valueop.value.type, 'boolean');         
            assert.equal(valueop.value.content, false);           
        });

        it('should serialize to the original input', function () {
            var input = {$ne: "foo"};
            valueop = new models.ValueOperator(input, {parse: true});
            assert.deepEqual(valueop.serialize(), input);
        });

        it('should receive the schema from its parent and pass it down to the leaf value', function () {
            var clause = new models.LeafClause({foo: {$ne: "bar"}}, {schema: schema, parse: true});
            opob = clause.value;
            assert.equal(opob.schema, schema);
            assert.equal(opob.operators.at(0).schema, schema);
            assert.equal(opob.operators.at(0).schema, schema);
        });

        it('should have its parent property point to the correct parent', function () {
            // parent is clause
            var clause = new models.LeafClause({foo: {$ne: 3}}, {schema: schema, parse: true});
            assert.equal(clause.value.parent, clause); 

            // parent is OperatorObject
            var opob = new models.OperatorObject({$gt: 4, $lt: 10}, {parse: true});
            opob.operators.forEach(function (valueop) {
                assert.equal(valueop.parent, opob);
            });
        });

        it('should be valid iff the value is valid', function () {
            // value without schema is always valid
            assert.ok ( valueop.valid );

            // now test with schema
            var clause = new models.LeafClause({foo: {$ne: false}}, {parse: true, schema: schema});
            valueop = clause.value.operators.at(0);
            // should not be valid because null != string
            assert.ok( !valueop.valid );
            // now it should be, because value has correct type
            valueop.value.content = 'foobar';
            assert.ok( valueop.valid );
            // wrong type again
            valueop.value.content = 123;
            assert.ok( !valueop.valid );
        });

        it('should have the correct className property', function () {
            assert.equal(valueop.className, 'ValueOperator');
        });

        it('should pass buffer:change events to its parent', function (done) {
            var input = {$ne: "foo"};
            valueop = new models.ValueOperator(input, {parse: true}); 
            valueop.on('change:buffer', function () {
                done();
            })
            valueop.value.content = "bar";
        })
    });


    describe('ListOperator', function () {
        var listop;

        beforeEach(function() {
            listop = new models.ListOperator();
        });

        it('should be an instance of Operator', function () {
            assert.ok( listop instanceof models.Operator );
        });

        it('should initially have empty operator string and [] values', function () {
            assert.ok(listop);
            assert.equal(listop.operator, '');
            assert.deepEqual(listop.values.serialize(), []);
        });

        it('should work with null and boolean values', function () {
            listop = new models.ListOperator({$in: ["foo", 1, null, false]}, {parse: true});
            assert.equal(listop.values.at(0).type, 'string');
            assert.equal(listop.values.at(1).type, 'number');
            assert.equal(listop.values.at(2).type, 'null');
            assert.equal(listop.values.at(3).type, 'boolean');
        });

        it('should only accept the defined list operators', function () {
            var listOperators = models.definitions.listOperators;
            _.each(listOperators, function (op) {
                listop.set('operator', op);
                assert.ok(listop);
            });

            var valueOperators = models.definitions.valueOperators;
            var treeOperators = models.definitions.treeOperators;
            var otherOperators = ['$foo', '$bar', '$baz'];
            var badOperators = [].concat(valueOperators, treeOperators, otherOperators);
            
            _.each(badOperators, function (op) {
                assert.throws(function () { listop.set('operator', op) }, TypeError);              
            });
        });

        it('should throw an error if the value is not an array', function () {
            assert.throws(function () { new models.ListOperator({$in: "foo"}, {parse: true}); }, TypeError);
        });

        it('should serialize to the original input', function () {
            var input = {$in: ['foo', 'bar', 'baz']}
            listop = new models.ListOperator(input, {parse: true});
            assert.deepEqual(listop.serialize(), input);
            assert.deepEqual(listop.buffer, input);
        });

        it('should receive the schema from its parent and pass it down to all leaf values', function () {
            var clause = new models.LeafClause({foo: {$nin: ["bar", "baz"]}}, {schema: schema, parse: true});
            listop = clause.value.operators.at(0);
            assert.equal(listop.schema, schema);
            listop.values.forEach(function (value) {
                assert.equal(value.schema, schema);
            });
        });

        it('should be valid iff all its children values are valid', function () {
            var clause = new models.LeafClause({foo: {$in: ["a", "b", "c"]}}, {schema: schema, parse: true});
            listop = clause.value.operators.at(0);
            // all children are valid
            assert.ok( listop.valid );
            // now change one value to become invalid
            listop.values.at(0).content = false;
            assert.ok( !listop.valid );
        });

        it('should have its parent property point to the correct parent', function () {
            // parent is clause
            var clause = new models.LeafClause({foo: {$in: [1, 2, 3]}}, {schema: schema, parse: true});
            assert.equal(clause.value.parent, clause);

            // parent is OperatorObject
            var opob = new models.OperatorObject({$in: [1, 2, 3], $nin: [3, 4, 5]}, {parse: true});
            opob.operators.forEach(function (listop) {
                assert.equal(listop.parent, opob);
            });
        });

        it('should have the correct className property', function () {
            assert.equal(listop.className, 'ListOperator');
        });

        it('should pass buffer:change events to its parent', function (done) {
            var input = {$in: [1, 2, 3]};
            listop = new models.ListOperator(input, {parse: true}); 
            listop.on('change:buffer', function () {
                done();
            })
            var value = listop.values.at(0);
            value.content = 0;
        });
    });

    describe('OperatorObject', function () {
        var opob;

        beforeEach(function() {
            opob = new models.OperatorObject();
        });

        it('should initially have 0 operators and serialize to {}', function () {
            assert.ok(opob);
            assert.equal(opob.operators.length, 0);
            assert.deepEqual(opob.serialize(), {});
        });

        it('should be an instance of Value', function () {
            assert.ok( opob instanceof models.Value );
        });

        it('should work with list and value operators and mixed', function () {
            opob = new models.OperatorObject({$gt: 5, $lt: 9}, {parse: true});
            assert.ok(opob.operators.at(0) instanceof ValueOperator);
            assert.ok(opob.operators.at(1) instanceof ValueOperator);
           
            opob = new models.OperatorObject({$in: [1, 2, 3], $nin: [2, 6, 7]}, {parse: true});
            assert.ok(opob.operators.at(0) instanceof ListOperator);
            assert.ok(opob.operators.at(1) instanceof ListOperator);

            opob = new models.OperatorObject({$gt: 5, $in: ["foo", "bar"]}, {parse: true});
            assert.ok(opob.operators.at(0) instanceof ValueOperator);
            assert.ok(opob.operators.at(1) instanceof ListOperator);
        });

        it('should accept a single operator', function () {
            opob = new models.OperatorObject({$ne: null}, {parse: true});  
            assert.equal(opob.operators.length, 1);
        });

        it('should merge same operators', function () {
            opob = new models.OperatorObject({$ne: null, $ne: true}, {parse: true});  
            assert.equal(opob.operators.length, 1);
            assert.equal(opob.operators.at(0).operator, '$ne');
        });

        it('should serialize to the original input', function () {
            var input = {$gte: 5, $in: [6, 9, 7, 5]};
            opob = new models.OperatorObject(input, {parse: true});
            assert.deepEqual(opob.serialize(), input);
        });

        it('should pass down the schema to all its operators', function () {
            opob = new models.OperatorObject({$gt: 5, $in: ["foo", "bar"]}, {parse: true, schema: schema});
            opob.operators.each(function (op) {
                assert.equal(op.schema, schema);
            });
        });

        it('should have its parent property point to the clause', function () {
            var clause = new models.LeafClause({foo: {$in: [1, 2, 3]}}, {schema: schema, parse: true});
            assert.equal(clause.value.parent, clause);
        });

        it('should have the correct className property', function () {
            assert.equal(opob.className, 'OperatorObject');
        });

        it('should pass ValueOperator buffer:change events to its parent', function (done) {
            opob = new models.OperatorObject({$gt: 5, $lt: 9}, {parse: true});
            opob.on('change:buffer', function () {
                done();
            })
            opob.operators.at(0).value.content = 3;
        });

        it('should pass ListOperator buffer:change events to its parent', function (done) {
            opob = new models.OperatorObject({$in: [1, 2, 3], $lt: 9}, {parse: true});
            opob.on('change:buffer', function () {
                done();
            })
            opob.operators.at(0).values.at(1).content = 5;
        });

        it('should trigger buffer:change event when adding or removing operators', function (done) {
            opob = new models.OperatorObject({$in: [1, 2, 3]}, {parse: true});
            opob.on('change:buffer', function () {
                done();
            })
            opob.operators.add(new models.ValueOperator({$lt: 9}, {parse: true}));
        });
    });

    describe('LeafClause', function() {
        var clause; 

        beforeEach(function() {
            clause = new models.LeafClause();
        });

        it('should create a key and value', function () {
            assert.ok(clause.key instanceof models.Key);
            assert.ok(clause.value instanceof models.Value);
        });

        it('should be an instance of Clause', function () {
            assert.ok( clause instanceof models.Clause );
        });

        it('should be valid even if empty', function () {
            assert.ok( clause.valid );
        })

        it('should pass null values down to LeafValue correctly', function () {
            clause = new models.LeafClause({a: null}, {parse: true});
            assert.equal(clause.value.content, null);
            assert.equal(clause.value.type, 'null');
        })

        it('should correctly parse key and leaf value', function () {
            clause = new models.LeafClause({foo: "test"}, {parse: true});
            assert.equal(clause.key.content, 'foo');
            assert.equal(clause.value.content, 'test');
            assert.ok( clause.value instanceof models.LeafValue );
        });

        it('should correctly parse operators for values', function () {
            // ValueOperator
            clause = new models.LeafClause({foo: {$gt: 4}}, {parse: true});
            var valueop = clause.value.operators.at(0);
            assert.ok( valueop instanceof models.ValueOperator );
            assert.equal( valueop.value.content, 4 );
            assert.equal( valueop.operator, '$gt' );

            // ListOperator
            clause = new models.LeafClause({foo: {$in: [1, "x", 3]}}, {parse: true});
            var listop = clause.value.operators.at(0);
            assert.ok( listop instanceof models.ListOperator );
            assert.deepEqual(listop.values.serialize(), [1, 'x', 3]);
            assert.equal( listop.operator, '$in' );

            // OperatorObject with mixed operators
            clause = new models.LeafClause({foo: {$gt: 5, $nin: [8, 9]}}, {parse: true});
            assert.ok( clause.value instanceof models.OperatorObject );
            assert.ok( clause.value.operators.at(0) instanceof ValueOperator);
            assert.ok( clause.value.operators.at(1) instanceof ListOperator);
            assert.deepEqual(clause.value.serialize(), {$gt: 5, $nin: [8, 9]});
        });
        
        it('should be valid only if both key and value are valid', function () {
            clause = new models.LeafClause({foo: "bar"}, {parse: true, schema: schema});
            assert.ok( clause.valid );

            // make value invalid (not string anymore)
            clause.value.content = 3;
            assert.ok( !clause.valid );
        });

        it('should have its parent property point to the expression', function () {
            var expr = new models.Expression({foo: "string", bar: 2}, {parse: true});
            expr.clauses.forEach(function (clause) {
                assert.equal(clause.parent, expr);
            })
        });

        it('should have the correct className property', function () {
            assert.equal(clause.className, 'LeafClause');
        });

        it('should pass buffer:change events from LeafValue to its parent', function (done) {
            clause = new models.LeafClause({foo: 4}, {parse: true});
            clause.on('change:buffer', function () {
                done();
            })
            clause.value.content = 3;
        });

        it('should pass buffer:change events from OperatorObject to its parent', function (done) {
            clause = new models.LeafClause({foo: {$in: [5, 6]}}, {parse: true});
            clause.on('change:buffer', function () {
                done();
            })
            clause.value.operators.add(new models.ValueOperator({$gt: 3}, {parse: true}));
        });

        it('should trigger buffer:change event if value changes to a new object', function (done) {
            clause = new models.LeafClause({foo: 4}, {parse: true});
            clause.on('change:buffer', function () {
                done()
            });
            clause.value = new models.OperatorObject({$gt: 4}, {parse: true});
        });

        it('should reattach a buffer:change event listener to new value objects', function (done) {
            clause = new models.LeafClause({foo: 4}, {parse: true});
            var count = 0;
            clause.on('change:buffer', function () {
                count ++;
                if (count === 2) done();
            });
            clause.value = new models.LeafValue(3, {parse: true});
            clause.value.content = 4;
        });
    });


    describe('Expression', function () {
        var expr; 

        beforeEach(function() {
            expr = new models.Expression();
        });

        it('should start with an empty clause collection', function () {
            assert.equal(expr.clauses.length, 0);
        });

        it('should have a valid {} clause initially', function () {
            assert.ok(expr.valid);
            assert.deepEqual(expr.buffer, {});
        });

        it('should pass down schema to its clauses', function () {
            var clause = expr.clauses.add({foo: 1});
            assert.equal(clause.schema, expr.schema);
            assert.equal(clause.key.schema, expr.schema);
            assert.equal(clause.value.schema, expr.schema);
        });
        
        it('should parse an initial query of simple values correctly', function () {
            var query = {num: 13, str: "foo", bool: true};
            var expr = new models.Expression(query, {parse: true});

            assert.equal(expr.clauses.length, 3);
            expr.clauses.forEach(function (clause) {
                assert.ok(clause instanceof models.LeafClause)
            })
            assert.deepEqual(expr.clauses.at(0).buffer, {num: 13});
            assert.deepEqual(expr.clauses.at(1).buffer, {str: "foo"});
            assert.deepEqual(expr.clauses.at(2).buffer, {bool: true});
            assert.equal(expr.clauses.at(0).key.buffer, "num");
            assert.equal(expr.clauses.at(0).value.buffer, 13);
            assert.equal(expr.clauses.at(0).value.type, "number");
        });

        it('should parse and serialize complex queries with operators', function () {
            var query = {a: 1, b: {x: 3}, c: {$ne: 5}, d: {$in: [1, 2, 3]}, e: {$gt: 5, $lt: 9}};
            expr = new models.Expression(query, {parse: true}); 
            assert.deepEqual(expr.serialize(), query);
        });

        it('should serialize to the original input', function () {
            var input = {num: 13, str: "foo", bool: true};
            expr = new models.Expression(input, {parse: true});
            assert.deepEqual(expr.serialize(), input);

        });

        it('should trigger a change:buffer event when adding/removing a clause', function (done) {
            var counter = 0;
            var expr = new models.Expression([], {parse: true});
            expr.on('change:buffer', function() {
                assert.ok(true);
                counter ++;
                if (counter === 2) done();
            });
            var clause = expr.clauses.add({foo: 1});
            expr.clauses.remove(clause);
        }); 

        it('should trigger a change:buffer event when a child buffer changes', function (done) {
            expr.clauses.add({bar: 1});
            var key = expr.clauses.at(0).key;
            expr.on('change:buffer', function () {
                done();
            })
            key.content = 'foo';
        });

        it('should become valid when child buffers become valid', function (done) {
            expr = new models.Expression({foo: 1}, {parse: true, schema: schema})
            var value = expr.clauses.at(0).value;
            expr.on('change:valid', function () {
                assert.ok( expr.valid );
                done();
            });
            value.content = "i'm a string";
        });

        it('should support multiple clauses', function () {
            for (var i = 0; i < 10; i++) {
                var doc = {};
                doc['key'+i] = 'foo';
                var c = expr.clauses.add(doc);
            }
            assert.equal(expr.clauses.length, 10);
        });

        it('should return an object of clauses as buffer', function () {
            var c1 = expr.clauses.add({foo: "bar"});
            var c2 = expr.clauses.add({counter: 159});

            assert.deepEqual(expr.buffer, _.assign(c1.buffer, c2.buffer));
            assert.deepEqual(expr.buffer, {"foo": "bar", "counter": 159});
        });

        it('should have the correct className property', function () {
            assert.equal(expr.className, 'Expression');
        });
    });

    describe('ExpressionTree', function () {
        var input, outerExpr, tree, innerExpr0, innerExpr1;

        beforeEach(function () {
            input = {$or: [{foo: 1}, {bar: false}]};
            outerExpr = new models.Expression(input, {parse: true});
            tree = outerExpr.clauses.at(0);
            innerExpr0 = tree.expressions.at(0);
            innerExpr1 = tree.expressions.at(1);
        });

        it('should parse an expression tree correctly', function () {
            assert.equal(tree.operator, '$or');
            tree.expressions.forEach(function (e) {
                assert.ok( e instanceof models.Expression );
            });
            assert.deepEqual(tree.serialize(), input);
            assert.deepEqual(outerExpr.serialize(), input);
        });

        it('should parse nested expression trees correctly', function () {
            input = {$and: [ {$or: [ {foo: 1}, {bar: false} ]}, {c: 1} ]};
            outerExpr = new models.Expression(input, {parse: true});
            // outer tree operator
            tree = outerExpr.clauses.at(0);
            assert.equal(tree.operator, '$and');

            tree.expressions.forEach(function (expr) {
                assert.ok( expr instanceof models.Expression );
            });
            assert.equal(tree.operator, '$and');
            assert.deepEqual(outerExpr.serialize(), input);
            assert.deepEqual(outerExpr.buffer, input);
        });

        it('should set parent on Expression and ExpressionTree correctly', function () {
            assert.equal(innerExpr0.parent, tree);
            assert.equal(innerExpr1.parent, tree);
            assert.equal(tree.parent, outerExpr);
        });

        it('should set schema on Expression and ExpressionTree correctly', function () {
            outerExpr = new models.Expression(input, {parse: true, schema: schema});
            tree = outerExpr.clauses.at(0);
            innerExpr0 = tree.expressions.at(0);
            innerExpr1 = tree.expressions.at(1);

            assert.equal(outerExpr.schema, schema);
            assert.equal(tree.schema, schema);
            assert.equal(innerExpr0.schema, schema);
            assert.equal(innerExpr1.schema, schema);
        });

        it('should trigger a change:buffer event when a expression buffer changes', function (done) {
            tree.on('change:buffer', function () {
                done();
            })
            innerExpr0.clauses.at(0).key.content = 'changed';
        });

        it('should trigger a change:buffer when an expression is added', function (done) {
            outerExpr.on('change:buffer', function () {
                done();
            })
            tree.expressions.add({thing: false});
        });

        it('should trigger a change:buffer when a clause is added inside an expression', function (done) {
            outerExpr.on('change:buffer', function () {
                done();
            })
            innerExpr0.clauses.add({thing: false});
        });

        it('should be an instance of Clause', function () {
            assert.ok( tree instanceof models.Clause );
        });
    });

    // describe('Query', function () {

    //     it('should work with complex queries', function () {
    //         var doc = {$and: [{$or: [{x:1, y:1}, {y: {$gt: 5, $lt: 9}}]}, 
    //                           {$or: [{z: {$in: ["foo", 1, null, false]}}, 
    //                           {a: 3}]}]};
    //         var query = models.Query(doc, {parse: true});
    //     })
    // })

});
