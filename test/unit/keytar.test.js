var assert = require('assert');

// TODO (@imlucas) Should be replaced by trying to require
// plugins which use native modules:
// - compass-connect
// - compass-connect-kerberos
// - etc.
describe.skip('keytar', function() {
  it('should be requirable', function() {
    assert.doesNotThrow(function() {
      require('keytar');
    });
  });
});
