import { expect } from 'chai';
import _ from 'lodash';

import { getTestTarget } from '../../test/helpers';
import type { TargetOptions, Target } from './target';

describe('target', function () {
  let env: NodeJS.ProcessEnv;

  beforeEach(function () {
    env = { ...process.env };
  });

  afterEach(function () {
    process.env = { ...env };
  });

  it('should have autoupdate endpoint resolved from the package.json config', function () {
    const target = getTestTarget();

    expect(target).to.have.property(
      'autoUpdateBaseUrl',
      'https://compass.mongodb.com'
    );
  });

  it('defaults to package.json distribution config options', function () {
    const target = getTestTarget();

    expect(target).to.have.property('distribution', 'compass');
    expect(target).to.have.property('name', 'compass');
    expect(target).to.have.property(
      'productName',
      'MongoDB Compass Enterprise super long test name Beta'
    );
    expect(target).to.have.property('readonly', false);
    expect(target).to.have.property('isolated', false);
    expect(target).to.have.property('version', '1.2.0-beta');
    expect(target).to.have.property('channel', 'beta');
  });

  it('allows to override distribution config with env vars', function () {
    Object.assign(process.env, {
      HADRON_DISTRIBUTION: 'compass-readonly',
      HADRON_PRODUCT: 'compass-compass',
      HADRON_PRODUCT_NAME: 'MongoDB Compass My Awesome Edition',
      HADRON_READONLY: 'true',
      HADRON_ISOLATED: 'true',
      HADRON_APP_VERSION: '1.2.3',
    });

    const target = getTestTarget();

    expect(target).to.have.property('distribution', 'compass-readonly');
    expect(target).to.have.property('channel', 'stable'); // from new version
    expect(target).to.have.property('name', 'compass-compass');
    expect(target).to.have.property(
      'productName',
      'MongoDB Compass My Awesome Edition'
    );
    expect(target).to.have.property('readonly', true);
    expect(target).to.have.property('isolated', true);
    expect(target).to.have.property('version', '1.2.3');
  });

  it('throws with an invalid version', () => {
    expect(() => {
      getTestTarget({
        version: '1.2.0-custom.5',
      });
    }).to.throw('Unknown channel custom');
  });

  describe('release channel', function () {
    const channels = {
      stable: getTestTarget({
        version: '1.2.0',
      }),
      beta: getTestTarget({
        version: '1.2.0-beta.1',
      }),
      dev: getTestTarget({
        version: '1.2.0-dev.5',
      }),
    };

    it('should have the right versions', function () {
      expect(channels.stable.version).to.equal('1.2.0');
      expect(channels.beta.version).to.equal('1.2.0-beta.1');
      expect(channels.dev.version).to.equal('1.2.0-dev.5');
    });

    it('should detect the channel from the version', function () {
      expect(channels.stable.channel).to.equal('stable');
      expect(channels.beta.channel).to.equal('beta');
      expect(channels.dev.channel).to.equal('dev');
    });

    it('should not include channel in the product name on stable', function () {
      expect(channels.stable.productName).to.equal(
        'MongoDB Compass Enterprise super long test name'
      );
    });

    it('should not include channel in the slug on stable', function () {
      expect(channels.stable.slug).to.equal('compass');
    });

    describe('For releases *not* on the stable channel', function () {
      it('should add the channel as a suffix to the product name', function () {
        expect(channels.beta.productName).to.equal(
          'MongoDB Compass Enterprise super long test name Beta'
        );
        expect(channels.dev.productName).to.equal(
          'MongoDB Compass Enterprise super long test name Dev'
        );
      });
      it('should add the channel as a suffix to the slug', function () {
        expect(channels.beta.slug).to.equal('compass-beta');
        expect(channels.dev.slug).to.equal('compass-dev');
      });
    });
  });

  describe('on Linux', function () {
    const linux: TargetOptions = {
      version: '1.2.0',
      platform: 'linux',
      arch: 'x64',
    };

    const c = getTestTarget(linux);
    const assetNames = _.map(c.assets, 'name');
    it('should produce a tarball asset', function () {
      expect(assetNames).to.contain(c.linux_tar_filename);
    });

    it('should produce a debian package asset', function () {
      expect(assetNames).to.contain(c.linux_deb_filename);
    });

    it('should produce a redhat package manager asset', function () {
      expect(assetNames).to.include(c.linux_rpm_filename);
    });
  });

  describe('on Windows', function () {
    const windows: TargetOptions = {
      version: '1.2.0',
      platform: 'win32',
      arch: 'x64',
    };

    let res: Target;
    before(function () {
      res = getTestTarget(windows);
    });

    it('should have the platform specific packager options', function () {
      const versionString = res.packagerOptions['version-string'];
      expect(versionString).to.be.a('object');
      expect(versionString?.CompanyName).to.equal('MongoDB Inc.');
      expect(versionString?.FileDescription).to.be.a('string');
      expect(versionString?.ProductName).to.be.a('string');
      expect(versionString?.InternalName).to.be.a('string');
    });

    it('should have the platform specific evergreen expansions', function () {
      expect(res.windows_msi_filename).to.equal('compass-1.2.0-win32-x64.msi');
      expect(res.windows_setup_filename).to.equal(
        'compass-1.2.0-win32-x64.exe'
      );
      expect(res.windows_zip_filename).to.equal('compass-1.2.0-win32-x64.zip');
      expect(res.windows_nupkg_full_filename).to.equal(
        'MongoDBCompassEnterprisesuperlongtestname-1.2.0-full.nupkg'
      );
      expect(res.windows_nupkg_full_label).to.equal(
        'MongoDBCompassEnterprisesuperlongtestname-1.2.0-full.nupkg'
      );
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

    describe('For non-stable channel releases', function () {
      let dev: Target;
      before(function () {
        dev = getTestTarget({
          version: '1.2.0-dev.5',
          platform: 'win32',
          arch: 'x64',
        });
      });

      it('should append the channel name to the product name', function () {
        const versionString = dev.packagerOptions['version-string'];
        expect(versionString?.ProductName).to.equal(
          'MongoDB Compass Enterprise super long test name Dev'
        );
      });

      it('should include the channel name in asset filenames', function () {
        expect(dev.windows_msi_filename).to.equal(
          'compass-1.2.0-dev.5-win32-x64.msi'
        );
        expect(dev.windows_setup_filename).to.equal(
          'compass-1.2.0-dev.5-win32-x64.exe'
        );
        expect(dev.windows_zip_filename).to.equal(
          'compass-1.2.0-dev.5-win32-x64.zip'
        );
        expect(dev.windows_nupkg_full_filename).to.equal(
          'MongoDBCompassEnterprisesuperlongtestnameDev-1.2.0-dev5-full.nupkg'
        );
      });
    });
  });
});
