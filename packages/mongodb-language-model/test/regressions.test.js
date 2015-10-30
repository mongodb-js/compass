var models = require('../models');
var assert = require('assert');
var _ = require('lodash');

describe('ampersand-state@4.7.0 regression', function() {
  it('should take a simple string and parse it correctly', function() {
    var parsed = {hello: "pikachuu"};
    var query = new models.Query(parsed, {parse: true});
    assert.deepEqual(query.serialize(), parsed);
    assert.equal(JSON.stringify(query.serialize()), '{"hello":"pikachuu"}');
  });
});
