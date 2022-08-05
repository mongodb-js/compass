const path = require('path');
const { expect } = require('chai');
const {
  versionId,
  readableVersionName,
  readablePlatformName,
  generateVersionsForAssets
} = require('../commands/upload');
const Target = require('../lib/target');

describe('upload', function() {
  describe('versionId', function() {
    it('returns a version number', function() {
      expect(versionId('1.2.3')).to.eq('1.2.3');
    });

    it('returns a version number when dist is just compass', function() {
      expect(versionId('1.2.3', 'compass')).to.eq('1.2.3');
    });

    it('returns a version number with dist when dist is custom', function() {
      expect(versionId('1.2.3', 'compass-isolated')).to.eq('1.2.3-isolated');
    });
  });

  describe('readableVersionName', function() {
    it('returns version number', function() {
      expect(readableVersionName('1.0.0')).to.eq('1.0.0');
    });

    it('returns version number with channel pretty-printed', function() {
      expect(readableVersionName('1.0.0', 'stable')).to.eq('1.0.0 (Stable)');
    });

    it('returns version number with channel and distribution pretty-printed', function() {
      expect(readableVersionName('1.0.0', 'beta', 'compass-readonly')).to.eq(
        '1.0.0 (Readonly Edition Beta)'
      );
    });
  });

  describe('readablePlatformName', function() {
    it('returns a pretty-printed platform / arch label', function() {
      expect(readablePlatformName('x64', 'darwin')).to.eq(
        'macOS 64-bit (10.14+)'
      );
    });

    it('throws for unsupported values', function() {
      expect(() => readablePlatformName('linux', 'arm64')).to.throw();
    });
  });

  describe('generateVersionsForAssets', function() {
    it('returns a versions list for provided assets / version / channel combo', function() {
      const version = '1.0.0';
      const assets = Target.getAssetsForVersion(
        // <monorepo>/packages/compass
        path.resolve(__dirname, '..', '..', 'compass'),
        version
      );
      const versions = generateVersionsForAssets(assets, version, 'stable');
      expect(versions).to.deep.eq([
        {
          _id: '1.0.0',
          platform: [
            {
              arch: 'x64',
              download_link:
                'https://downloads.mongodb.com/compass/mongodb-compass-1.0.0-darwin-x64.dmg',
              name: 'macOS 64-bit (10.14+)',
              os: 'darwin'
            },
            {
              arch: 'arm64',
              download_link:
                'https://downloads.mongodb.com/compass/mongodb-compass-1.0.0-darwin-arm64.dmg',
              name: 'macOS arm64 (M1) (11.0+)',
              os: 'darwin'
            },
            {
              arch: 'x64',
              download_link:
                'https://downloads.mongodb.com/compass/mongodb-compass_1.0.0_amd64.deb',
              name: 'Ubuntu 64-bit (16.04+)',
              os: 'linux'
            },
            {
              arch: 'x64',
              download_link:
                'https://downloads.mongodb.com/compass/mongodb-compass-1.0.0.x86_64.rpm',
              name: 'RedHat 64-bit (7+)',
              os: 'linux'
            },
            {
              arch: 'x64',
              download_link:
                'https://downloads.mongodb.com/compass/mongodb-compass-1.0.0-win32-x64.exe',
              name: 'Windows 64-bit (7+)',
              os: 'win32'
            },
            {
              arch: 'x64',
              download_link:
                'https://downloads.mongodb.com/compass/mongodb-compass-1.0.0-win32-x64.msi',
              name: 'Windows 64-bit (7+) (MSI)',
              os: 'win32'
            },
            {
              arch: 'x64',
              download_link:
                'https://downloads.mongodb.com/compass/mongodb-compass-1.0.0-win32-x64.zip',
              name: 'Windows 64-bit (7+) (Zip)',
              os: 'win32'
            }
          ],
          version: '1.0.0 (Stable)'
        },
        {
          _id: '1.0.0-readonly',
          platform: [
            {
              arch: 'x64',
              download_link:
                'https://downloads.mongodb.com/compass/mongodb-compass-readonly-1.0.0-darwin-x64.dmg',
              name: 'macOS 64-bit (10.14+)',
              os: 'darwin'
            },
            {
              arch: 'arm64',
              download_link:
                'https://downloads.mongodb.com/compass/mongodb-compass-readonly-1.0.0-darwin-arm64.dmg',
              name: 'macOS arm64 (M1) (11.0+)',
              os: 'darwin'
            },
            {
              arch: 'x64',
              download_link:
                'https://downloads.mongodb.com/compass/mongodb-compass-readonly_1.0.0_amd64.deb',
              name: 'Ubuntu 64-bit (16.04+)',
              os: 'linux'
            },
            {
              arch: 'x64',
              download_link:
                'https://downloads.mongodb.com/compass/mongodb-compass-readonly-1.0.0.x86_64.rpm',
              name: 'RedHat 64-bit (7+)',
              os: 'linux'
            },
            {
              arch: 'x64',
              download_link:
                'https://downloads.mongodb.com/compass/mongodb-compass-readonly-1.0.0-win32-x64.exe',
              name: 'Windows 64-bit (7+)',
              os: 'win32'
            },
            {
              arch: 'x64',
              download_link:
                'https://downloads.mongodb.com/compass/mongodb-compass-readonly-1.0.0-win32-x64.msi',
              name: 'Windows 64-bit (7+) (MSI)',
              os: 'win32'
            },
            {
              arch: 'x64',
              download_link:
                'https://downloads.mongodb.com/compass/mongodb-compass-readonly-1.0.0-win32-x64.zip',
              name: 'Windows 64-bit (7+) (Zip)',
              os: 'win32'
            }
          ],
          version: '1.0.0 (Readonly Edition Stable)'
        },
        {
          _id: '1.0.0-isolated',
          platform: [
            {
              arch: 'x64',
              download_link:
                'https://downloads.mongodb.com/compass/mongodb-compass-isolated-1.0.0-darwin-x64.dmg',
              name: 'macOS 64-bit (10.14+)',
              os: 'darwin'
            },
            {
              arch: 'arm64',
              download_link:
                'https://downloads.mongodb.com/compass/mongodb-compass-isolated-1.0.0-darwin-arm64.dmg',
              name: 'macOS arm64 (M1) (11.0+)',
              os: 'darwin'
            },
            {
              arch: 'x64',
              download_link:
                'https://downloads.mongodb.com/compass/mongodb-compass-isolated_1.0.0_amd64.deb',
              name: 'Ubuntu 64-bit (16.04+)',
              os: 'linux'
            },
            {
              arch: 'x64',
              download_link:
                'https://downloads.mongodb.com/compass/mongodb-compass-isolated-1.0.0.x86_64.rpm',
              name: 'RedHat 64-bit (7+)',
              os: 'linux'
            },
            {
              arch: 'x64',
              download_link:
                'https://downloads.mongodb.com/compass/mongodb-compass-isolated-1.0.0-win32-x64.exe',
              name: 'Windows 64-bit (7+)',
              os: 'win32'
            },
            {
              arch: 'x64',
              download_link:
                'https://downloads.mongodb.com/compass/mongodb-compass-isolated-1.0.0-win32-x64.msi',
              name: 'Windows 64-bit (7+) (MSI)',
              os: 'win32'
            },
            {
              arch: 'x64',
              download_link:
                'https://downloads.mongodb.com/compass/mongodb-compass-isolated-1.0.0-win32-x64.zip',
              name: 'Windows 64-bit (7+) (Zip)',
              os: 'win32'
            }
          ],
          version: '1.0.0 (Isolated Edition Stable)'
        }
      ]);
    });
  });
});
