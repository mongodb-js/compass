var assert = require('assert');
var helpers = require('./helpers');

describe('kerberos', function() {
  it('should be requirable', function() {
    assert.doesNotThrow(function() {
      require('kerberos');
    });
  });

  it('should be requirable in Electron', function(done) {
    helpers.requireInElectron('kerberos', 'Kerberos',
                              function(err) { done(err); });
  });
});
