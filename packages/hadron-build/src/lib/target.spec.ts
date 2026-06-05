import chai from 'chai';
import Target from './target';
import { getTarget } from '../../test/test-helpers';
import * as darwinFixture from '../../test/fixtures/darwin';
import * as linuxFixture from '../../test/fixtures/linux';
import * as win32Fixture from '../../test/fixtures/win32';
import { getExpectedTargetProps } from '../../test/fixtures/target-props';

const { expect } = chai;

const CHANNEL_VERSIONS = {
  stable: '1.2.0',
  beta: '1.2.0-beta.1',
  dev: '1.2.0-dev.5',
};

const PLATFORM_AND_DISTRIBUTION_COMBINATIONS =
  Target.supportedPlatforms.flatMap((platform) => {
    return Target.supportedDistributions.map((distribution) => {
      return {
        platform: platform.platform,
        arch: platform.arch,
        distribution,
      };
    });
  });

const platformFixtures = {
  darwin: darwinFixture,
  linux: linuxFixture,
  win32: win32Fixture,
} as const;

describe('target', function () {
  describe('Release channel support', function () {
    for (const channel in CHANNEL_VERSIONS) {
      const version =
        CHANNEL_VERSIONS[channel as keyof typeof CHANNEL_VERSIONS];
      const opts = { version };
      describe(`for ${channel} channel`, function () {
        it('should have the right version', function () {
          const target = getTarget(opts);
          expect(target.version).to.equal(version);
        });

        it('should have the right channel name', function () {
          const target = getTarget(opts);
          expect(target.channel).to.equal(channel);
        });

        it('should have the right slug', function () {
          const target = getTarget(opts);
          if (channel === 'stable') {
            // For stable, the slug is just 'mongodb-compass'
            expect(target.slug).to.equal('mongodb-compass');
          } else {
            // For other channels, the slug is 'mongodb-compass-{channel}'
            expect(target.slug).to.equal(`mongodb-compass-${channel}`);
          }
        });

        it('should have the right product name', function () {
          const target = getTarget(opts);
          if (channel === 'stable') {
            expect(target.productName).to.equal('MongoDB Compass');
          } else {
            expect(target.productName).to.equal(
              `MongoDB Compass ${
                channel.charAt(0).toUpperCase() + channel.slice(1)
              }`
            );
          }
        });
      });
    }

    describe('for dev channel only', function () {
      it('if `DEV_VERSION_IDENTIFIER` is set, it takes version from there', function () {
        const initialDevVersionIdentifier = process.env.DEV_VERSION_IDENTIFIER;
        try {
          process.env.DEV_VERSION_IDENTIFIER = '1.2.0-dev.10';
          const target = getTarget({
            version: '1.2.0-dev.5',
          });
          expect(target.version).to.equal('1.2.0-dev.10');
        } finally {
          process.env.DEV_VERSION_IDENTIFIER = initialDevVersionIdentifier;
        }
      });
    });

    describe('Target.getChannelFromVersion', function () {
      it('should return the right channel', function () {
        expect(Target.getChannelFromVersion('1.2.0')).to.equal('stable');
        expect(Target.getChannelFromVersion('1.2.0-beta.1')).to.equal('beta');
        expect(Target.getChannelFromVersion('1.2.0-BETA.1')).to.equal('beta');
        expect(Target.getChannelFromVersion('1.2.0-dev.5')).to.equal('dev');
        expect(Target.getChannelFromVersion('1.2.0-DEV.5')).to.equal('dev');
      });

      it('should throw if channel is not one of stable/beta/dev', function () {
        try {
          Target.getChannelFromVersion('1.2.0-rc.1');
          expect.fail('Expected getChannelFromVersion to throw');
        } catch (e) {
          expect((e as Error).message).to.equal(
            'Unsupported channel "rc" for version 1.2.0-rc.1'
          );
        }
      });
    });
  });

  describe('Release assets', function () {
    for (const config of PLATFORM_AND_DISTRIBUTION_COMBINATIONS) {
      for (const channel in CHANNEL_VERSIONS) {
        const version =
          CHANNEL_VERSIONS[channel as keyof typeof CHANNEL_VERSIONS];
        const fixture =
          platformFixtures[config.platform as keyof typeof platformFixtures];
        it(`it should have right assets for ${config.distribution} on ${config.arch} using ${config.arch} running ${version}`, function () {
          const target = getTarget({
            version,
            platform: config.platform,
            arch: config.arch,
            distribution: config.distribution,
          });
          // eslint-disable-next-line no-unused-vars
          const assets = target.assets.map(({ path, ...rest }) => rest);
          expect(assets).to.deep.equal(
            fixture.getExpectedAssets({
              version,
              arch: config.arch,
              distribution: config.distribution,
              channel,
            })
          );
        });
      }
    }
  });

  describe('Packager options', function () {
    for (const channel in CHANNEL_VERSIONS) {
      const version =
        CHANNEL_VERSIONS[channel as keyof typeof CHANNEL_VERSIONS];
      it(`has the right options for win32 on ${channel} channel`, function () {
        const target = getTarget({
          version,
          platform: 'win32',
          arch: 'x64',
          distribution: 'compass',
        });

        const { afterExtract, ...actualPackagerOptions } =
          target.packagerOptions;

        expect(afterExtract).to.be.an('array').of.length(1);
        expect(afterExtract![0]).to.be.a('function');

        expect(actualPackagerOptions).to.deep.equal(
          win32Fixture.getExpectedPackagerOptions({
            version,
            arch: 'x64',
            distribution: 'compass',
            channel,
          })
        );
      });

      it(`has the right options for linux on ${channel} channel`, function () {
        const target = getTarget({
          version,
          platform: 'linux',
          arch: 'x64',
          distribution: 'compass',
        });

        const { afterExtract, ...actualPackagerOptions } =
          target.packagerOptions;

        expect(afterExtract).to.be.an('array').of.length(1);
        expect(afterExtract![0]).to.be.a('function');

        expect(actualPackagerOptions).to.deep.equal(
          linuxFixture.getExpectedPackagerOptions({
            version,
            arch: 'x64',
            distribution: 'compass',
            channel,
          })
        );
      });

      it(`has the right options for darwin on ${channel} channel`, function () {
        const target = getTarget({
          version,
          platform: 'darwin',
          arch: 'x64',
          distribution: 'compass',
        });

        const { afterExtract, ...actualPackagerOptions } =
          target.packagerOptions;

        expect(afterExtract).to.be.an('array').of.length(1);
        expect(afterExtract![0]).to.be.a('function');

        expect(actualPackagerOptions).to.deep.equal(
          darwinFixture.getExpectedPackagerOptions({
            version,
            arch: 'x64',
            distribution: 'compass',
            channel,
          })
        );
      });
    }
  });

  describe('Installer options', function () {
    for (const channel in CHANNEL_VERSIONS) {
      const version =
        CHANNEL_VERSIONS[channel as keyof typeof CHANNEL_VERSIONS];
      it(`has the correct options for win32 on ${channel} channel`, function () {
        const target = getTarget({
          version,
          platform: 'win32',
          arch: 'x64',
          distribution: 'compass',
        });
        expect(target.installerOptions).to.deep.equal(
          win32Fixture.getExpectedInstallerOptions({
            version,
            arch: 'x64',
            distribution: 'compass',
            channel,
          })
        );
      });

      it(`has the correct options for linux on ${channel} channel`, function () {
        const target = getTarget({
          version,
          platform: 'linux',
          arch: 'x64',
          distribution: 'compass',
        });
        const {
          deb,
          rpm: { rename, ...rpm },
        } = target.installerOptions as any;
        expect(rename).to.be.a('function');

        const expected = linuxFixture.getExpectedInstallerOptions({
          version,
          arch: 'x64',
          distribution: 'compass',
          channel,
        });
        expect(deb).to.deep.equal(expected.deb);
        expect(rpm).to.deep.equal(expected.rpm);
      });

      it(`has the correct options for darwin on ${channel} channel`, function () {
        const target = getTarget({
          version,
          platform: 'darwin',
          arch: 'x64',
          distribution: 'compass',
        });
        expect(target.installerOptions).to.deep.equal(
          darwinFixture.getExpectedInstallerOptions({
            version,
            arch: 'x64',
            distribution: 'compass',
            channel,
          })
        );
      });
    }
  });

  describe('Sets class properties', function () {
    /**
     * Within above describe blocks, we are testing:
     * 1. Channel specifics (name, version, productName, etc.)
     * 2. Plaform assets
     * 3. Installer options
     * 4. Packager options
     *
     * In this describe block, we are testing the remaining class properties
     */

    for (const config of PLATFORM_AND_DISTRIBUTION_COMBINATIONS) {
      for (const channel in CHANNEL_VERSIONS) {
        const version =
          CHANNEL_VERSIONS[channel as keyof typeof CHANNEL_VERSIONS];
        it(`sets target props for ${config.distribution} on ${config.arch} using ${config.arch} running ${version}`, function () {
          const target = getTarget({ ...config, version });

          expect(target.createInstaller).to.be.a('function');

          expect(target).to.deep.include(
            getExpectedTargetProps({ ...config, version, channel })
          );
        });
      }
    }
  });

  describe('target', function () {
    let env: NodeJS.ProcessEnv;

    beforeEach(function () {
      env = { ...process.env };
    });

    afterEach(function () {
      process.env = { ...env };
    });

    it('allows to override distribution config with env vars', function () {
      Object.assign(process.env, {
        HADRON_DISTRIBUTION: 'compass-isolated',
        HADRON_PRODUCT: 'compass-compass',
        HADRON_PRODUCT_NAME: 'MongoDB Compass Isolated Edition',
        HADRON_READONLY: 'true',
        HADRON_ISOLATED: 'true',
        HADRON_APP_VERSION: '1.2.3',
      });

      const target = getTarget({
        // getTarget will set distribution to 'compass' by default, so we need to undefined it here
        distribution: undefined,
      });

      expect(target).to.have.property('distribution', 'compass-isolated');
      expect(target).to.have.property('name', 'compass-compass');
      expect(target).to.have.property(
        'productName',
        'MongoDB Compass Isolated Edition'
      );
      expect(target).to.have.property('readonly', true);
      expect(target).to.have.property('isolated', true);
      expect(target).to.have.property('version', '1.2.3');
    });
  });
});
