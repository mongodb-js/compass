'use strict';

let AutoUpdateManager = require('../');
const assert = require('assert');
const electronVersion = require('electron-prebuilt/package.json').version;

describe('hadron-auto-update-manager', () => {
  it('should have an export', () => {
    assert(AutoUpdateManager);
  });
  it('should require an arg to the constructor', () => {
    assert.throws(() => new AutoUpdateManager());
  });
  it('should setup', () => {
    const endpoint = 'https://hadron-endpoint.herokuapp.com';
    const autoUpdateManager = new AutoUpdateManager(endpoint, null, 'compass', 'stable', 'linux');
    assert.equal(autoUpdateManager.version, electronVersion);
    assert.equal(autoUpdateManager.feedURL,
      `https://hadron-endpoint.herokuapp.com/api/v2/update/compass/stable/linux/${electronVersion}`);
  });
});
