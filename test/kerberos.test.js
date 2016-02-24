var assert = require('assert');
var helpers = require('./helpers');

describe('kerberos', function() {
  it('should be requirable', function() {
    assert.doesNotThrow(function() {
      require('kerberos');
    });
  });
});
