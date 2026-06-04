import chai from 'chai';
import Target from './target';
import { getTarget } from '../../test/test-helpers';

const { expect } = chai;

function ucFirst(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const CHANNEL_VERSIONS = {
  stable: '1.2.0',
  beta: '1.2.0-beta.1',
  dev: '1.2.0-dev.5',
};

describe('hadron-build::config', function () {
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
    type BuildAssetOpts = {
      version: string;
      arch: string;
      distribution: string;
    };
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
          name: `MongoDB${opts.distribution.split('-').map(ucFirst).join('')}${
            opts.distribution === 'compass-isolated' ? 'Edition' : ''
          }-${opts.version}-full.nupkg`,
        },
        // MongoDBCompassReadonly-1.2.0-full.nupkg.sig
        {
          name: `MongoDB${opts.distribution.split('-').map(ucFirst).join('')}${
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
      // TODO: Add beta and dev versions
      for (const version of ['1.2.0']) {
        const getExpectedAssets =
          platformAssets[config.platform as keyof typeof platformAssets];
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
            getExpectedAssets({
              version,
              arch: config.arch,
              distribution: config.distribution,
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

        expect(actualPackagerOptions).to.deep.equal({
          dir: target.dir,
          out: target.out,
          overwrite: true,
          appCopyright: `${new Date().getFullYear()} MongoDB Inc`,
          buildVersion: version,
          appVersion: version,
          prune: false,
          ignore: /node_modules\/|\.cache\/|dist\/|test\/|\.user-data|\.deps\//,
          platform: 'win32',
          arch: 'x64',
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          electronVersion: require('electron/package.json').version,
          name: `MongoDBCompass${
            channel !== 'stable' ? `${ucFirst(channel)}` : ''
          }`,
          icon: target.src(
            `app-icons/win32/mongodb-compass-logo-${channel}.ico`
          ),
          'version-string': {
            CompanyName: 'MongoDB Inc',
            FileDescription: 'The MongoDB GUI',
            ProductName: `MongoDB Compass${
              channel !== 'stable' ? ` ${ucFirst(channel)}` : ''
            }`,
            InternalName: 'mongodb-compass',
          },
        });
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

        expect(actualPackagerOptions).to.deep.equal({
          dir: target.dir,
          out: target.out,
          overwrite: true,
          appCopyright: `${new Date().getFullYear()} MongoDB Inc`,
          buildVersion: version,
          appVersion: version,
          prune: false,
          ignore: /node_modules\/|\.cache\/|dist\/|test\/|\.user-data|\.deps\//,
          platform: 'linux',
          arch: 'x64',
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          electronVersion: require('electron/package.json').version,
          name: `MongoDB Compass${
            channel !== 'stable' ? ` ${ucFirst(channel)}` : ''
          }`,
        });
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

        expect(actualPackagerOptions).to.deep.equal({
          dir: target.dir,
          out: target.out,
          overwrite: true,
          appCopyright: `${new Date().getFullYear()} MongoDB Inc`,
          buildVersion: version,
          appVersion: version,
          prune: false,
          ignore: /node_modules\/|\.cache\/|dist\/|test\/|\.user-data|\.deps\//,
          platform: 'darwin',
          arch: 'x64',
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          electronVersion: require('electron/package.json').version,
          icon: target.src(
            `app-icons/darwin/mongodb-compass-logo-${channel}.icns`
          ),
          name: `MongoDB Compass${
            channel !== 'stable' ? ` ${ucFirst(channel)}` : ''
          }`,
          appBundleId: `com.mongodb.compass${
            channel !== 'stable' ? `.${channel}` : ''
          }`,
          appCategoryType: 'public.app-category.productivity',
          protocols: [
            {
              name: 'MongoDB Protocol',
              schemes: ['mongodb'],
            },
            {
              name: 'MongoDB+SRV Protocol',
              schemes: ['mongodb+srv'],
            },
          ],
        });
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
        expect(target.installerOptions).to.deep.equal({
          loadingGif: target.src(
            'app-icons/win32/mongodb-compass-installer-loading.gif'
          ),
          iconUrl: 'https://compass.mongodb.com/favicon.ico',
          appDirectory: target.src(
            `dist/MongoDBCompass${
              channel !== 'stable' ? `${ucFirst(channel)}` : ''
            }-win32-x64`
          ),
          outputDirectory: target.src('dist'),
          authors: 'MongoDB Inc',
          version,
          exe: `MongoDBCompass${
            channel !== 'stable' ? `${ucFirst(channel)}` : ''
          }.exe`,
          setupExe: `mongodb-compass-${version}-win32-x64.exe`,
          signWithParams: 'sign',
          title: `MongoDB Compass${
            channel !== 'stable' ? ` ${ucFirst(channel)}` : ''
          }`,
          productName: `MongoDB Compass${
            channel !== 'stable' ? ` ${ucFirst(channel)}` : ''
          }`,
          description: 'The MongoDB GUI',
          name: `MongoDBCompass${
            channel !== 'stable' ? `${ucFirst(channel)}` : ''
          }`,
          noMsi: true,
        });
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

        expect(deb).to.deep.equal({
          src: target.src(
            `dist/MongoDB Compass${
              channel !== 'stable' ? ` ${ucFirst(channel)}` : ''
            }-linux-x64`
          ),
          dest: target.src('dist'),
          arch: 'amd64',
          icon: target.src(
            `app-icons/linux/mongodb-compass-logo-${channel}.png`
          ),
          name: `mongodb-compass${channel !== 'stable' ? `-${channel}` : ''}`,
          version,
          bin: `MongoDB Compass${
            channel !== 'stable' ? ` ${ucFirst(channel)}` : ''
          }`,
          section: 'Databases',
          depends: ['libsecret-1-0', 'gnome-keyring'],
          mimeType: [
            'x-scheme-handler/mongodb',
            'x-scheme-handler/mongodb+srv',
          ],
        });

        expect(rpm).to.deep.equal({
          src: target.src(
            `dist/MongoDB Compass${
              channel !== 'stable' ? ` ${ucFirst(channel)}` : ''
            }-linux-x64`
          ),
          dest: target.src('dist'),
          arch: 'x86_64',
          icon: target.src(
            `app-icons/linux/mongodb-compass-logo-${channel}.png`
          ),
          name: `mongodb-compass${channel !== 'stable' ? `-${channel}` : ''}`,
          version: channel === 'stable' ? version : version.split('-')[0],
          revision: channel === 'stable' ? '1' : version.split('-')[1],
          bin: `MongoDB Compass${
            channel !== 'stable' ? ` ${ucFirst(channel)}` : ''
          }`,
          requires: ['gnome-keyring', 'libsecret'],
          categories: [
            'Office',
            'Database',
            'Building',
            'Debugger',
            'IDE',
            'GUIDesigner',
            'Profiling',
          ],
          license: 'SSPL',
          mimeType: [
            'x-scheme-handler/mongodb',
            'x-scheme-handler/mongodb+srv',
          ],
        });
      });

      it(`has the correct options for darwin on ${channel} channel`, function () {
        const target = getTarget({
          version,
          platform: 'darwin',
          arch: 'x64',
          distribution: 'compass',
        });
        const folderName = `MongoDB Compass${
          channel !== 'stable' ? ` ${ucFirst(channel)}` : ''
        }-darwin-x64`;
        const name = `MongoDB Compass${
          channel !== 'stable' ? ` ${ucFirst(channel)}` : ''
        }`;
        expect(target.installerOptions).to.deep.equal({
          dmgPath: target.src(`dist/mongodb-compass-${version}-darwin-x64.dmg`),
          title: name.substring(0, 25),
          overwrite: true,
          out: target.src('dist'),
          icon: target.src(
            `app-icons/darwin/mongodb-compass-logo-${channel}.icns`
          ),
          identity_display: undefined,
          identity: undefined,
          appPath: target.src(
            `dist/${folderName}/MongoDB Compass${
              channel !== 'stable' ? ` ${ucFirst(channel)}` : ''
            }.app`
          ),
          background: target.src('app-icons/darwin/background.png'),
          contents: [
            { x: 322, y: 243, type: 'link', path: '/Applications' },
            {
              x: 93,
              y: 243,
              type: 'file',
              path: target.src(`dist/${folderName}/${name}.app`),
            },
          ],
        });
      });
    }
  });
});
