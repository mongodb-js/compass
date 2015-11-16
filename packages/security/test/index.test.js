var assert = require('assert');
var security = require('../');

describe('mongodb-security', function() {
  it('should work', function() {
    assert(security);
  });

  it('should have roles', function() {
    assert(security.roles);
  });

  it('should have actions', function() {
    assert(security.actions);
  });
});
