var AutoUpdateManager = require('../');
var assert = require('assert');

describe('hadron-auto-update-manager', function() {
  it('should work', function() {
    assert(AutoUpdateManager);
    assert(new AutoUpdateManager());
  });
});
