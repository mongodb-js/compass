var models = require('../models');
var assert = require('assert');
var _ = require('lodash');


describe('Base', function() {
  var base;

  beforeEach(function() {
    base = new models.Base();
  });

  it('should initially have invalid state', function() {
    assert.equal(base.valid, false);
  });

  it('should initially have a null buffer', function() {
    assert.equal(base.buffer, null);
  });

  it('should have the correct className property', function() {
    assert.equal(base.className, 'Base');
  });
});
