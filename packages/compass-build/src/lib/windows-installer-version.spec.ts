import assert from 'assert';
import windowsInstallerVersion from './windows-installer-version';

describe('windowsInstallerVersion', function () {
  it('returns 0.0.0.0 if version is not defined', function () {
    assert.strictEqual(windowsInstallerVersion(), '0.0.0.0');
    assert.strictEqual(windowsInstallerVersion(''), '0.0.0.0');
    assert.strictEqual(windowsInstallerVersion(undefined), '0.0.0.0');
  });

  it('returns version if version is already suitable', function () {
    assert.strictEqual(windowsInstallerVersion('1.1.1.1'), '1.1.1.1');
  });

  it('returns MAJOR.MINOR.PATCH.0 if version is a GA semver', function () {
    assert.strictEqual(windowsInstallerVersion('1.1.1'), '1.1.1.0');
  });

  it('returns MAJOR.MINOR.PATCH.0 if version is a prerelease semver', function () {
    assert.strictEqual(windowsInstallerVersion('1.1.1-beta.0'), '1.1.1.0');
  });
});
