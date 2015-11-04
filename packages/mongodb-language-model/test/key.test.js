var models = require('../models');
var assert = require('assert');

describe('Key', function() {
  var key;

  beforeEach(function() {
    key = new models.Key();
  });

  it('should initially have an empty string content', function() {
    assert.equal(key.content, '');
  });

  it('should return the content via the derived buffer property', function() {
    key.content = 'foobar';
    assert.equal(key.buffer, 'foobar');
  });

  it('should serialize to the key content', function() {
    key.content = 'foobar';
    assert.equal(key.serialize(), 'foobar');
  });

  it('should be invalid if the buffer is empty', function() {
    // empty buffer, valid
    key.content = '';
    assert.ok(!key.valid);
  });

  it('should be valid if the buffer contains a dot', function() {
    // . in buffer, valid
    key.content = 'foo.bar';
    assert.ok(key.valid);
    // valid example
    key.content = 'foobar';
    assert.ok(key.valid);
  });

  it('should have its parent property point to the clause', function() {
    var clause = new models.LeafClause({
      foo: 'bar'
    }, {
      parse: true
    });
    assert.equal(clause.key.parent, clause);
  });

  it('should have the correct className property', function() {
    assert.equal(key.className, 'Key');
  });

  it('should trigger a buffer change event if key was changed', function(done) {
    key.on('change:buffer', function() {
      done();
    });

    key.content = 'changed';
  });
});
