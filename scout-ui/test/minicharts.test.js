var shared = require('../src/minicharts/d3fns/shared');
var assert = require('assert');

describe('shared components', function() {
  it('should return percentages for bottom, middle and top scale correctly', function() {
    assert.deepEqual(shared.percentFormat(2.1), ['0%', '105%', '210%']);
    assert.deepEqual(shared.percentFormat(2.0), ['0%', '100%', '200%']);
    assert.deepEqual(shared.percentFormat(1.0), ['0%', '50%', '100%']);
    assert.deepEqual(shared.percentFormat(0.995), ['0%', '50%', '100%']);
    assert.deepEqual(shared.percentFormat(0.99), ['0%', '49.5%', '99%']);
    assert.deepEqual(shared.percentFormat(0.9900001), ['0%', '49.5%', '99%']);
    assert.deepEqual(shared.percentFormat(0.49999), ['0%', '25%', '50%']);
    assert.deepEqual(shared.percentFormat(0.011), ['0%', '0.5%', '1%']);
    assert.deepEqual(shared.percentFormat(0.009), ['0%', '0.45%', '0.9%']);
    assert.deepEqual(shared.percentFormat(0.004), ['0%', '0.2%', '0.4%']);
    assert.deepEqual(shared.percentFormat(0.0), ['0%', '0%', '0%']);
    assert.deepEqual(shared.percentFormat(-0.015), ['0%', '-1%', '-2%']);
  });
});
