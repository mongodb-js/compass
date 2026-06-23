import chai from 'chai';
import { windowsInstallerVersion } from './windows-installer-version';

const { expect } = chai;

describe('windowsInstallerVersion', function () {
  it('returns 0.0.0.0 if version is not defined', function () {
    expect(windowsInstallerVersion(undefined as unknown as string)).to.equal(
      '0.0.0.0'
    );
    expect(windowsInstallerVersion('')).to.equal('0.0.0.0');
    expect(windowsInstallerVersion(null as unknown as string)).to.equal(
      '0.0.0.0'
    );
  });

  it('returns version if version is already suitable', function () {
    expect(windowsInstallerVersion('1.1.1.1')).to.equal('1.1.1.1');
  });

  it('returns MAJOR.MINOR.PATCH.0 if version is a GA semver', function () {
    expect(windowsInstallerVersion('1.1.1')).to.equal('1.1.1.0');
  });

  it('returns MAJOR.MINOR.PATCH.0 if version is a prerelease semver', function () {
    expect(windowsInstallerVersion('1.1.1-beta.0')).to.equal('1.1.1.0');
  });
});
