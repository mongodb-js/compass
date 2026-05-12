import { expect } from 'chai';
import { versionId, readableVersionName, readablePlatformName } from './upload';

describe('commands/upload', function () {
  describe('versionId', function () {
    it('returns a version number', function () {
      expect(versionId('1.2.3')).to.eq('1.2.3');
    });

    it('returns version when distribution is just compass', function () {
      expect(versionId('1.2.3', 'compass')).to.eq('1.2.3');
    });

    it('appends stripped distribution name when custom', function () {
      expect(versionId('1.2.3', 'compass-isolated')).to.eq('1.2.3-isolated');
    });
  });

  describe('readableVersionName', function () {
    it('returns version number alone', function () {
      expect(readableVersionName('1.0.0')).to.eq('1.0.0');
    });

    it('appends stable channel label', function () {
      expect(readableVersionName('1.0.0', 'stable')).to.eq('1.0.0 (Stable)');
    });

    it('combines channel and distribution labels', function () {
      expect(readableVersionName('1.0.0', 'beta', 'compass-readonly')).to.eq(
        '1.0.0 (Readonly Edition Beta)'
      );
    });
  });

  describe('readablePlatformName', function () {
    it('returns darwin x64 label', function () {
      expect(readablePlatformName('x64', 'darwin')).to.eq(
        'macOS x64 (Intel) (11+)'
      );
    });

    it('returns darwin arm64 label', function () {
      expect(readablePlatformName('arm64', 'darwin')).to.eq(
        'macOS arm64 (Apple silicon) (11.0+)'
      );
    });

    it('returns win32 x64 label', function () {
      expect(readablePlatformName('x64', 'win32')).to.eq(
        'Windows 64-bit (10+)'
      );
    });

    it('appends Zip suffix for .zip files', function () {
      expect(readablePlatformName('x64', 'win32', 'app.zip')).to.eq(
        'Windows 64-bit (10+) (Zip)'
      );
    });

    it('appends MSI suffix for .msi files', function () {
      expect(readablePlatformName('x64', 'win32', 'app.msi')).to.eq(
        'Windows 64-bit (10+) (MSI)'
      );
    });

    it('returns linux deb label for non-rpm', function () {
      expect(readablePlatformName('x64', 'linux', 'app.deb')).to.eq(
        'Ubuntu 64-bit (20.04+)'
      );
    });

    it('returns linux rpm label for .rpm files', function () {
      expect(readablePlatformName('x64', 'linux', 'app.rpm')).to.eq(
        'RedHat 64-bit (8+)'
      );
    });

    it('throws for unsupported platform/arch combos', function () {
      expect(() => readablePlatformName('arm64', 'linux')).to.throw();
    });
  });
});
