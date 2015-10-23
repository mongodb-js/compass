var data = require('../');
var assert = require('assert');

describe('mongodb-connection-fixture', function() {
  it('should work', function() {
    assert(data);
  });
  it('should have the MATRIX', function() {
    /* eslint no-console:0 */
    assert(Array.isArray(data.MATRIX));
    console.log(data.MATRIX);
  });
});
