var assert = require('assert');

describe('keytar', function() {
  it('should be requirable', function() {
    assert.doesNotThrow(function() {
      require('keytar');
    });
  });
});
