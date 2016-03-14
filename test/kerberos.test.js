var assert = require('assert');

describe('kerberos', function() {
  /**
   * TODO (imlucas) Fails to compile silently...
   * @see  https://jira.mongodb.org/browse/INT-1229
   */
  it.skip('should be requirable', function() {
    assert.doesNotThrow(function() {
      require('kerberos');
    });
  });
});
