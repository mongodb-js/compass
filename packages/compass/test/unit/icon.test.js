var assert = require('assert');
var icon = require('../../src/icon');

describe('icon', function() {
  it('should be a non-empty nativeImage', function() {
    assert.equal(icon.isEmpty(), false);
  });
});
