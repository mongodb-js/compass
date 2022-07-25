let AutoUpdateManager = require('../');
const assert = require('assert');

describe('hadron-auto-update-manager', () => {
  it('should have an export', () => {
    assert(AutoUpdateManager);
  });
  it('should require an arg to the constructor', () => {
    assert.throws(() => new AutoUpdateManager());
  });
  it('should setup', () => {
    const endpoint = 'https://hadron-endpoint.herokuapp.com';
    const autoUpdateManager = new AutoUpdateManager(endpoint, null, 'compass', 'stable', 'linux', 'x64');

    assert.equal(autoUpdateManager.version, process.versions.electron);
    assert.equal(autoUpdateManager.feedURL,
      `https://hadron-endpoint.herokuapp.com/api/v2/update/compass/stable/linux-x64/${process.versions.electron}`);
  });
});
