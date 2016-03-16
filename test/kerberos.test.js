var assert = require('assert');

describe('kerberos', function() {
  it('should be requirable', function() {
    assert.doesNotThrow(function() {
      require('kerberos');
    });
  });
});
