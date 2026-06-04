/* eslint no-unused-vars: 1 */
import _ from 'lodash';
import chai from 'chai';
import Target from './target';
import { getTarget } from '../../test/test-helpers';

const { expect } = chai;

describe('hadron-build::config', function () {
  describe('Release channel support', function () {
    const channels = {
      stable: {
        version: '1.2.0',
      },
      beta: {
        version: '1.2.0-beta.1',
      },
      dev: {
        version: '1.2.0-dev.5',
      },
    } as const;

    for (const channel in channels) {
      const opts = channels[channel as keyof typeof channels];
      describe(`for ${channel} channel`, function () {
        it('should have the right version', async function () {
          const target = await getTarget(opts);
          expect(target.version).to.equal(opts.version);
        });

        it('should have the right channel name', async function () {
          const target = await getTarget(opts);
          expect(target.channel).to.equal(channel);
        });

        it('should have the right slug', async function () {
          const target = await getTarget(opts);
          if (channel === 'stable') {
            // For stable, the slug is just 'mongodb-compass'
            expect(target.slug).to.equal('mongodb-compass');
          } else {
            // For other channels, the slug is 'mongodb-compass-{channel}'
            expect(target.slug).to.equal(`mongodb-compass-${channel}`);
          }
        });

        it('should have the right product name', async function () {
          const target = await getTarget(opts);
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
      it('if `DEV_VERSION_IDENTIFIER` is set, it takes version from there', async function () {
        const initialDevVersionIdentifier = process.env.DEV_VERSION_IDENTIFIER;
        try {
          process.env.DEV_VERSION_IDENTIFIER = '1.2.0-dev.10';
          const target = await getTarget({
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
    type BuildAssetOpts = {
      version: string;
      arch: string;
      distribution: string;
    };
    // TODO: Support for channels
    const platformAssets = {
      darwin: (opts: BuildAssetOpts) => [
        // mongodb-compass-readonly-1.2.0-darwin-x64.dmg
        {
          name: `mongodb-${opts.distribution}-${opts.version}-darwin-${opts.arch}.dmg`,
          downloadCenter: true,
        },
        // mongodb-compass-readonly-1.2.0-darwin-x64.zip
        {
          name: `mongodb-${opts.distribution}-${opts.version}-darwin-${opts.arch}.zip`,
        },
        // mongodb-compass-readonly-1.2.0-darwin-x64.zip.sig
        {
          name: `mongodb-${opts.distribution}-${opts.version}-darwin-${opts.arch}.zip.sig`,
        },
      ],
      linux: (opts: BuildAssetOpts) => [
        // mongodb-compass-readonly_1.2.0_amd64.deb
        {
          name: `mongodb-${opts.distribution}_${opts.version}_${
            opts.arch === 'x64' ? 'amd64' : 'i386'
          }.deb`,
          downloadCenter: true,
        },
        // mongodb-compass-readonly_1.2.0_amd64.deb.sig
        {
          name: `mongodb-${opts.distribution}_${opts.version}_${
            opts.arch === 'x64' ? 'amd64' : 'i386'
          }.deb.sig`,
        },
        // mongodb-compass-readonly-1.2.0.x86_64.rpm
        {
          name: `mongodb-${opts.distribution}-${opts.version}.${
            opts.arch === 'x64' ? 'x86_64' : 'i386'
          }.rpm`,
          downloadCenter: true,
        },
        // mongodb-compass-readonly-1.2.0-linux-x64.tar.gz
        {
          name: `mongodb-${opts.distribution}-${opts.version}-linux-${opts.arch}.tar.gz`,
        },
        // mongodb-compass-readonly-1.2.0-linux-x64.tar.gz.sig
        {
          name: `mongodb-${opts.distribution}-${opts.version}-linux-${opts.arch}.tar.gz.sig`,
        },
        // mongodb-compass-readonly-1.2.0-rhel-x64.tar.gz
        {
          name: `mongodb-${opts.distribution}-${opts.version}-rhel-${opts.arch}.tar.gz`,
        },
        // mongodb-compass-readonly-1.2.0-rhel-x64.tar.gz.sig
        {
          name: `mongodb-${opts.distribution}-${opts.version}-rhel-${opts.arch}.tar.gz.sig`,
        },
      ],
      win32: (opts: BuildAssetOpts) => [
        // mongodb-compass-readonly-1.2.0-win32-x64.exe
        {
          name: `mongodb-${opts.distribution}-${opts.version}-win32-x64.exe`,
          downloadCenter: true,
        },
        // mongodb-compass-readonly-1.2.0-win32-x64.msi
        {
          name: `mongodb-${opts.distribution}-${opts.version}-win32-x64.msi`,
          downloadCenter: true,
        },
        // mongodb-compass-readonly-1.2.0-win32-x64.zip
        {
          name: `mongodb-${opts.distribution}-${opts.version}-win32-x64.zip`,
          downloadCenter: true,
        },
        // mongodb-compass-readonly-1.2.0-win32-x64.zip.sig
        {
          name: `mongodb-${opts.distribution}-${opts.version}-win32-x64.zip.sig`,
        },
        // mongodb-compass-readonly-RELEASES
        { name: `mongodb-${opts.distribution}-RELEASES` },
        // For Isolated, we are using config.hardon.distributions.isolated.productName which is 'MongoDB Compass Isolated Edition'
        // MongoDBCompassReadonly-1.2.0-full.nupkg
        {
          name: `MongoDB${opts.distribution
            .split('-')
            .map(_.capitalize)
            .join('')}${
            opts.distribution === 'compass-isolated' ? 'Edition' : ''
          }-${opts.version}-full.nupkg`,
        },
        // MongoDBCompassReadonly-1.2.0-full.nupkg.sig
        {
          name: `MongoDB${opts.distribution
            .split('-')
            .map(_.capitalize)
            .join('')}${
            opts.distribution === 'compass-isolated' ? 'Edition' : ''
          }-${opts.version}-full.nupkg.sig`,
        },
      ],
    };

    const platformAndDistributionCombinations =
      Target.supportedPlatforms.flatMap((platform) => {
        return Target.supportedDistributions.map((distribution) => {
          return {
            platform: platform.platform,
            arch: platform.arch,
            distribution,
          };
        });
      });

    for (const config of platformAndDistributionCombinations) {
      describe(`${config.distribution}-${config.platform}-${config.arch}`, function () {
        const getExpectedAssets =
          platformAssets[config.platform as keyof typeof platformAssets];
        it('should have the right assets', async function () {
          const target = await getTarget({
            platform: config.platform,
            version: '1.2.0',
            arch: config.arch,
            distribution: config.distribution,
          });
          // eslint-disable-next-line no-unused-vars
          const assets = target.assets.map(({ path, ...rest }) => rest);
          expect(assets).to.deep.equal(
            getExpectedAssets({
              version: '1.2.0',
              arch: config.arch,
              distribution: config.distribution,
            })
          );
        });
      });
    }
  });

  // describe.only('Packager options', function () {
  //   it.skip('has the right options for all platforms', async function () {
  //     const target = await getTarget({
  //       version: '1.2.0',
  //       platform: 'linux',
  //       arch: 'x64',
  //       distribution: 'compass',
  //     });
  //     console.log(target.packagerOptions);
  //   });
  // });

  // describe.only('Installer options', function () {
  //   it.only('has the right options for all platforms', async function () {
  //     const target = await getTarget({
  //       version: '1.2.0',
  //       platform: 'win32',
  //       arch: 'x64',
  //       distribution: 'compass',
  //     });
  //     console.log(target.installerOptions);
  //   });
  // });

  describe('Only on Windows', function () {
    const windows = {
      version: '1.2.0',
      product_name: 'Hadron',
      platform: 'win32',
      author: 'MongoDB Inc',
      arch: 'x64',
    };

    let res: Target;
    before(async function () {
      res = await getTarget(windows);
    });
    it.skip('should have the platform specific packager options', function () {
      const versionString = res.packagerOptions['version-string']!;
      expect(versionString).to.be.a('object');
      expect(versionString.CompanyName).to.equal('MongoDB Inc');
      expect(versionString.FileDescription).to.be.a('string');
      expect(versionString.ProductName).to.be.a('string');
      expect(versionString.InternalName).to.be.a('string');
    });

    it('should have the platform specific installer options', function () {
      const opts = res.installerOptions;
      expect(opts).to.have.property('loadingGif');
      expect(opts).to.have.property('signWithParams');
      expect(opts).to.have.property('iconUrl');
      expect(opts).to.have.property('appDirectory');
      expect(opts).to.have.property('outputDirectory');
      expect(opts).to.have.property('authors');
      expect(opts).to.have.property('version');
      expect(opts).to.have.property('exe');
      expect(opts).to.have.property('setupExe');
      expect(opts).to.have.property('title');
      expect(opts).to.have.property('productName');
      expect(opts).to.have.property('description');
      expect(opts).to.have.property('name');
    });
  });
});
