const assert = require('assert');
const windowsInstallerVersion = require('../lib/windows-installer-version');

describe('windowsInstallerVersion', () => {
  it('returns 0.0.0.0 if version is not defined', () => {
    assert.strictEqual(windowsInstallerVersion(), '0.0.0.0');
    assert.strictEqual(windowsInstallerVersion(''), '0.0.0.0');
    assert.strictEqual(windowsInstallerVersion(null), '0.0.0.0');
  });

  it('returns version if version is already suitable', () => {
    assert.strictEqual(windowsInstallerVersion('1.1.1.1'), '1.1.1.1');
  });

  it('returns MAJOR.MINOR.PATCH.0 if version is a GA semver', () => {
    assert.strictEqual(windowsInstallerVersion('1.1.1'), '1.1.1.0');
  });

  it('returns MAJOR.MINOR.PATCH.0 if version is a prerelease semver', () => {
    assert.strictEqual(windowsInstallerVersion('1.1.1-beta.0'), '1.1.1.0');
  });
});
