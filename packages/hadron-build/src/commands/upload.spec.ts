import path from 'path';
import { expect } from 'chai';
import sinon from 'sinon';
import yargs from 'yargs';
import createCLI from 'mongodb-js-cli';
import {
  versionId,
  readableVersionName,
  readablePlatformName,
  generateVersionsForAssets,
  uploadCommand,
} from './upload';
import Target from '../lib/target';
import { ROOT_DIR } from '../../test/test-helpers';

async function runUpload(...args: string[]): Promise<void> {
  await yargs(['upload', ...args])
    .command(uploadCommand)
    .version(false)
    .exitProcess(false)
    .fail((msg, err) => {
      throw err ?? new Error(msg);
    })
    .parseAsync();
}

describe('upload', function () {
  describe('versionId', function () {
    it('returns a version number', function () {
      expect(versionId('1.2.3')).to.eq('1.2.3');
    });

    it('returns a version number when dist is just compass', function () {
      expect(versionId('1.2.3', 'compass')).to.eq('1.2.3');
    });

    it('returns a version number with dist when dist is custom', function () {
      expect(versionId('1.2.3', 'compass-isolated')).to.eq('1.2.3-isolated');
    });
  });

  describe('readableVersionName', function () {
    it('returns version number', function () {
      expect(readableVersionName('1.0.0')).to.eq('1.0.0');
    });

    it('returns version number with channel pretty-printed', function () {
      expect(readableVersionName('1.0.0', 'stable')).to.eq('1.0.0 (Stable)');
    });

    it('returns version number with channel and distribution pretty-printed', function () {
      expect(readableVersionName('1.0.0', 'beta', 'compass-readonly')).to.eq(
        '1.0.0 (Readonly Edition Beta)'
      );
    });
  });

  describe('readablePlatformName', function () {
    it('returns a pretty-printed platform / arch label', function () {
      expect(readablePlatformName('x64', 'darwin')).to.eq(
        'macOS x64 (Intel) (11+)'
      );
    });

    it('throws for unsupported values', function () {
      expect(() => readablePlatformName('linux', 'arm64')).to.throw();
    });
  });

  describe('generateVersionsForAssets', function () {
    it('returns a versions list for provided assets / version / channel combo', function () {
      const version = '1.0.0';
      const assets = Target.getAssetsForVersion(
        // <monorepo>/packages/compass
        path.resolve(__dirname, '..', '..', '..', 'compass'),
        version
      );
      const versions = generateVersionsForAssets(assets, version, 'stable');
      expect(versions).to.deep.eq([
        {
          _id: '1.0.0',
          platform: [
            {
              arch: 'arm64',
              download_link:
                'https://downloads.mongodb.com/compass/mongodb-compass-1.0.0-darwin-arm64.dmg',
              name: 'macOS arm64 (Apple silicon) (11.0+)',
              os: 'darwin',
            },
            {
              arch: 'x64',
              download_link:
                'https://downloads.mongodb.com/compass/mongodb-compass-1.0.0-darwin-x64.dmg',
              name: 'macOS x64 (Intel) (11+)',
              os: 'darwin',
            },
            {
              arch: 'x64',
              download_link:
                'https://downloads.mongodb.com/compass/mongodb-compass_1.0.0_amd64.deb',
              name: 'Ubuntu 64-bit (20.04+)',
              os: 'linux',
            },
            {
              arch: 'x64',
              download_link:
                'https://downloads.mongodb.com/compass/mongodb-compass-1.0.0.x86_64.rpm',
              name: 'RedHat 64-bit (8+)',
              os: 'linux',
            },
            {
              arch: 'x64',
              download_link:
                'https://downloads.mongodb.com/compass/mongodb-compass-1.0.0-win32-x64.exe',
              name: 'Windows 64-bit (10+)',
              os: 'win32',
            },
            {
              arch: 'x64',
              download_link:
                'https://downloads.mongodb.com/compass/mongodb-compass-1.0.0-win32-x64.msi',
              name: 'Windows 64-bit (10+) (MSI)',
              os: 'win32',
            },
            {
              arch: 'x64',
              download_link:
                'https://downloads.mongodb.com/compass/mongodb-compass-1.0.0-win32-x64.zip',
              name: 'Windows 64-bit (10+) (Zip)',
              os: 'win32',
            },
          ],
          version: '1.0.0 (Stable)',
        },
        {
          _id: '1.0.0-readonly',
          platform: [
            {
              arch: 'arm64',
              download_link:
                'https://downloads.mongodb.com/compass/mongodb-compass-readonly-1.0.0-darwin-arm64.dmg',
              name: 'macOS arm64 (Apple silicon) (11.0+)',
              os: 'darwin',
            },
            {
              arch: 'x64',
              download_link:
                'https://downloads.mongodb.com/compass/mongodb-compass-readonly-1.0.0-darwin-x64.dmg',
              name: 'macOS x64 (Intel) (11+)',
              os: 'darwin',
            },
            {
              arch: 'x64',
              download_link:
                'https://downloads.mongodb.com/compass/mongodb-compass-readonly_1.0.0_amd64.deb',
              name: 'Ubuntu 64-bit (20.04+)',
              os: 'linux',
            },
            {
              arch: 'x64',
              download_link:
                'https://downloads.mongodb.com/compass/mongodb-compass-readonly-1.0.0.x86_64.rpm',
              name: 'RedHat 64-bit (8+)',
              os: 'linux',
            },
            {
              arch: 'x64',
              download_link:
                'https://downloads.mongodb.com/compass/mongodb-compass-readonly-1.0.0-win32-x64.exe',
              name: 'Windows 64-bit (10+)',
              os: 'win32',
            },
            {
              arch: 'x64',
              download_link:
                'https://downloads.mongodb.com/compass/mongodb-compass-readonly-1.0.0-win32-x64.msi',
              name: 'Windows 64-bit (10+) (MSI)',
              os: 'win32',
            },
            {
              arch: 'x64',
              download_link:
                'https://downloads.mongodb.com/compass/mongodb-compass-readonly-1.0.0-win32-x64.zip',
              name: 'Windows 64-bit (10+) (Zip)',
              os: 'win32',
            },
          ],
          version: '1.0.0 (Readonly Edition Stable)',
        },
        {
          _id: '1.0.0-isolated',
          platform: [
            {
              arch: 'arm64',
              download_link:
                'https://downloads.mongodb.com/compass/mongodb-compass-isolated-1.0.0-darwin-arm64.dmg',
              name: 'macOS arm64 (Apple silicon) (11.0+)',
              os: 'darwin',
            },
            {
              arch: 'x64',
              download_link:
                'https://downloads.mongodb.com/compass/mongodb-compass-isolated-1.0.0-darwin-x64.dmg',
              name: 'macOS x64 (Intel) (11+)',
              os: 'darwin',
            },
            {
              arch: 'x64',
              download_link:
                'https://downloads.mongodb.com/compass/mongodb-compass-isolated_1.0.0_amd64.deb',
              name: 'Ubuntu 64-bit (20.04+)',
              os: 'linux',
            },
            {
              arch: 'x64',
              download_link:
                'https://downloads.mongodb.com/compass/mongodb-compass-isolated-1.0.0.x86_64.rpm',
              name: 'RedHat 64-bit (8+)',
              os: 'linux',
            },
            {
              arch: 'x64',
              download_link:
                'https://downloads.mongodb.com/compass/mongodb-compass-isolated-1.0.0-win32-x64.exe',
              name: 'Windows 64-bit (10+)',
              os: 'win32',
            },
            {
              arch: 'x64',
              download_link:
                'https://downloads.mongodb.com/compass/mongodb-compass-isolated-1.0.0-win32-x64.msi',
              name: 'Windows 64-bit (10+) (MSI)',
              os: 'win32',
            },
            {
              arch: 'x64',
              download_link:
                'https://downloads.mongodb.com/compass/mongodb-compass-isolated-1.0.0-win32-x64.zip',
              name: 'Windows 64-bit (10+) (Zip)',
              os: 'win32',
            },
          ],
          version: '1.0.0 (Isolated Edition Stable)',
        },
      ]);
    });
  });

  describe('command handler', function () {
    let sandbox: sinon.SinonSandbox;
    let originalEnv: NodeJS.ProcessEnv;

    let loggerStub: sinon.SinonStub;

    beforeEach(function () {
      sandbox = sinon.createSandbox();
      originalEnv = { ...process.env };

      delete process.env.CI;
      delete process.env.EVERGREEN_PROJECT;

      const cli = Object.getPrototypeOf(createCLI('test'));
      loggerStub = sandbox.stub(cli, 'error');
    });

    afterEach(function () {
      sandbox.restore();
      process.env = originalEnv;
    });

    describe('option parsing', function () {
      it('parses `--manifest` as a boolean `true`', async function () {
        let parsed: any;
        await yargs(['upload', '--manifest'])
          .command({
            ...uploadCommand,
            handler: (argv) => {
              parsed = argv;
            },
          })
          .version(false)
          .exitProcess(false)
          .parseAsync();
        expect(parsed.manifest).to.equal(true);
      });

      it('defaults `manifest` to boolean `false`', async function () {
        let parsed: any;
        await yargs(['upload'])
          .command({
            ...uploadCommand,
            handler: (argv) => {
              parsed = argv;
            },
          })
          .version(false)
          .exitProcess(false)
          .parseAsync();
        expect(parsed.manifest).to.equal(false);
      });

      it('parses a bare `--dry-run` flag as boolean `true`', async function () {
        let parsed: any;
        await yargs(['upload', '--dry-run'])
          .command({
            ...uploadCommand,
            handler: (argv) => {
              parsed = argv;
            },
          })
          .version(false)
          .exitProcess(false)
          .parseAsync();
        expect(parsed.dryRun).to.equal(true);
      });
    });

    describe('environment guards', function () {
      it('errors when publishing a release from a non-CI environment', async function () {
        await runUpload('--dir', ROOT_DIR, '--version', '1.2.3');
        expect(
          loggerStub.calledWithMatch(
            'Trying to publish a release from non-CI environment'
          )
        ).to.equal(true);
      });

      it('errors when publishing assets from a non-Evergreen CI environment', async function () {
        process.env.CI = 'true';
        // CI set, EVERGREEN_PROJECT unset, not a dry run, not a manifest run.
        await runUpload('--dir', ROOT_DIR, '--version', '1.2.3');
        expect(
          loggerStub.calledWithMatch(
            'Trying to publish assets from non-Evergreen CI environment'
          )
        ).to.equal(true);
      });

      it('errors for an unsupported publish channel', async function () {
        process.env.CI = 'true';
        process.env.EVERGREEN_PROJECT = 'compass-stable';
        await runUpload('--dir', ROOT_DIR, '--version', '1.2.3-dev.0');
        expect(
          loggerStub.calledWithMatch('Skipping publish release for dev channel')
        ).to.equal(true);
      });

      it('errors when the Evergreen project channel is unsupported', async function () {
        process.env.CI = 'true';
        process.env.EVERGREEN_PROJECT = 'compass-nightly';
        await runUpload('--dir', ROOT_DIR, '--version', '1.2.3');
        expect(
          loggerStub.calledWithMatch('unsupported Evergreen project')
        ).to.equal(true);
      });

      it('errors when the release channel mismatches the Evergreen project', async function () {
        process.env.CI = 'true';
        // `testing` project maps to `beta`, but version is stable.
        process.env.EVERGREEN_PROJECT = 'compass-testing';
        await runUpload('--dir', ROOT_DIR, '--version', '1.2.3');
        expect(loggerStub.calledWithMatch('mismatched channel')).to.equal(true);
      });
    });
  });
});
