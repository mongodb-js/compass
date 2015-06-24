var models = require('../models');
var assert = require('assert');
var _ = require('lodash');
var bson = require('bson');
var debug = require('debug')('mongodb-language-model:test');


describe('LeafValue', function() {
  var value;

  beforeEach(function() {
    value = new models.LeafValue();
  });

  it('should be an instance of Value', function() {
    assert.ok(value instanceof models.Value);
  });

  it('should initially have a null type and null value', function() {
    assert.equal(value.type, 'null');
    assert.equal(value.content, null);
  });

  it('should be able to parse null as a value', function() {
    value = new models.LeafValue(null, {
      parse: true
    });
    assert.equal(value.type, 'null');
    assert.equal(value.content, null);
  });

  it('should initially have a null content', function() {
    assert.equal(value.content, null);
  });

  it('should return the content via the derived buffer property', function() {
    value.content = 'foobar';
    assert.equal(value.buffer, 'foobar');
  });

  it('should return the content via serialize()', function() {
    value.content = 'foobar';
    assert.equal(value.serialize(), 'foobar');
  });

  it('should return correct type based on the value', function() {
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

    value.content = [1, 'foo', 3];
    assert.equal(value.type, 'array');

    value.content = /foo/i;
    assert.equal(value.type, 'regex');

    value.content = {
      a: 1,
      b: 1
    };
    assert.equal(value.type, 'object');
  });

  it('should parse the value', function() {
    var value = new models.LeafValue('this_is_a_string', {
      parse: true
    });
    assert.equal(value.type, 'string');
    assert.equal(value.content, 'this_is_a_string');

    value = new models.LeafValue(123, {
      parse: true
    });
    assert.equal(value.type, 'number');
    assert.equal(value.content, 123);

    value = new models.LeafValue(null, {
      parse: true
    });
    assert.equal(value.type, 'null');
    assert.equal(value.content, null);
  });

  it('should work with MongoDB BSON values', function () {
    var types = [
      'ObjectID',
      'Long',
      'Double',
      'Timestamp',
      'Symbol',
      'Code',
      'MinKey',
      'MaxKey',
      'DBRef',
      'Binary'
    ];
    var value;
    types.forEach(function (type) {
      value = new models.LeafValue(new bson[type](), {
        parse: true
      });
      assert.equal(value.type, type.toLowerCase());
      assert.ok(value.content instanceof bson[type]);
      debug(value.buffer);
    });
  });

  it('should have its parent property point to the clause', function() {
    var clause = new models.LeafClause({
      foo: 'bar'
    }, {
      parse: true
    });
    assert.equal(clause.value.parent, clause);
  });

  it('should have the correct className property', function() {
    assert.equal(value.className, 'LeafValue');
  });

  it('should trigger a buffer change event if content was changed', function(done) {
    value.on('change:buffer', function() {
      done();
    });
    value.content = 'changed';
  });
});
