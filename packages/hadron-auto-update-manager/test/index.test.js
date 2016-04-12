'use strict';

let AutoUpdateManager = require('../');
const assert = require('assert');

describe('hadron-auto-update-manager', () => {
  it('should work', () => {
    assert(AutoUpdateManager);
    assert(new AutoUpdateManager());
  });
});
