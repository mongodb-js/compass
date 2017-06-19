'use strict';
/* eslint no-unused-vars: 1 */
const _ = require('lodash');
const chai = require('chai');
const getConfig = require('./helpers').getConfig;
const expect = chai.expect;

describe('hadron-build::config', () => {
  describe('Release channel support', () => {
    const channels = {
      stable: getConfig({
        version: '1.2.0'
      }),
      beta: getConfig({
        version: '1.2.0-beta.1'
      }),
      custom: getConfig({
        version: '1.2.0-custom.5'
      })
    };

    it('should have the right versions', () => {
      expect(channels.stable.version).to.equal('1.2.0');
      expect(channels.beta.version).to.equal('1.2.0-beta.1');
      expect(channels.custom.version).to.equal('1.2.0-custom.5');
    });

    it('should detect the channel from the version', () => {
      expect(channels.stable.channel).to.equal('stable');
      expect(channels.beta.channel).to.equal('beta');
      expect(channels.custom.channel).to.equal('custom');
    });

    it('should not include channel in the product name on stable', () => {
      expect(channels.stable.productName).to.equal('MongoDB Compass Enterprise super long test name');
    });

    it('should not include channel in the slug on stable', () => {
      expect(channels.stable.slug).to.equal('compass');
    });

    describe('For releases *not* on the stable channel', () => {
      it('should add the channel as a suffix to the product name', () => {
        expect(channels.beta.productName).to.equal('MongoDB Compass Enterprise super long test name Beta');
        expect(channels.custom.productName).to.equal('MongoDB Compass Enterprise super long test name Custom');
      });
      it('should add the channel as a suffix to the slug', () => {
        expect(channels.beta.slug).to.equal('compass-beta');
        expect(channels.custom.slug).to.equal('compass-custom');
      });
    });

    describe.skip('Alpha', () => {
      process.env.CI = 1;
      const moment = require('moment');

      const dev = getConfig({
        version: '1.2.0-dev'
      });

      const version = `1.2.0-alpha.${moment().format('YYYYMMDDHHmm')}`;

      it('should update version', () => {
        expect(dev.version).to.equal(version);
        expect(dev.pkg.version).to.equal(version);
      });

      it('should update slug', () => {
        expect(dev.slug).to.equal('hadron-app-alpha');
      });

      it('should update channel', () => {
        expect(dev.channel).to.equal('alpha');
      });
    });
  });
  describe('Only on macOS', () => {
    const macOS = {
      version: '1.2.0',
      product_name: 'Hadron',
      app_bundle_id: 'com.mongodb.hadron',
      platform: 'darwin'
    };

    it('should set app-bundle-id', () => {
      expect(getConfig(macOS).packagerOptions['app-bundle-id']).to.equal('com.mongodb.hadron');
    });

    it('should automatically support release channels for app-bundle-id', () => {
      let beta = getConfig(_.defaults({version: '1.2.0-beta.1'}, macOS));
      expect(beta.packagerOptions['app-bundle-id']).to.equal('com.mongodb.hadron.beta');

      let alpha = getConfig(_.defaults({version: '1.2.0-custom.5'}, macOS));
      expect(alpha.packagerOptions['app-bundle-id']).to.equal('com.mongodb.hadron.custom');
    });
  });

  describe('Only on Linux', () => {
    const linux = {
      name: 'hadron-app',
      version: '1.2.0',
      product_name: 'Hadron',
      platform: 'linux'
    };

    const c = getConfig(linux);
    const assetNames = _.map(c.assets, 'name');
    it('should produce a tarball asset', () => {
      expect(assetNames).to.contain(c.linux_tar_filename);
    });

    it('should produce a debian package asset', () => {
      expect(assetNames).to.contain(c.linux_deb_filename);
    });

    it('should produce a redhat package manager asset', () => {
      expect(assetNames).to.include(c.linux_rpm_filename);
    });
  });

  describe('Only on Windows', () => {
    const windows = {
      version: '1.2.0',
      product_name: 'Hadron',
      platform: 'win32',
      author: 'MongoDB Inc'
    };

    let res;
    before( () => {
      res = getConfig(windows);
    });
    it.skip('should have the platform specific packager options', () => {
      let versionString = res.packagerOptions['version-string'];
      expect(versionString).to.be.a('object');
      expect(versionString.CompanyName).to.equal('MongoDB Inc');
      expect(versionString.FileDescription).to.be.a('string');
      expect(versionString.ProductName).to.be.a('string');
      expect(versionString.InternalName).to.be.a('string');
    });

    it('should have the platform specific evergreen expansions', () => {
      expect(res.windows_msi_filename).to.equal('MongoDB Compass Enterprise super long test nameSetup.msi');
      expect(res.windows_setup_filename).to.equal('MongoDB Compass Enterprise super long test nameSetup.exe');
      expect(res.windows_zip_filename).to.equal('MongoDB Compass Enterprise super long test name-windows.zip');
      expect(res.windows_nupkg_full_filename).to.equal('MongoDBCompassEnterprisesuperlongtestname-1.2.0-full.nupkg');
      expect(res.windows_nupkg_full_label).to.equal('MongoDBCompassEnterprisesuperlongtestname-1.2.0-full.nupkg');
    });

    it('should have the platform specific installer options', () => {
      let opts = res.installerOptions;
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

    describe('For non-stable channel releases', () => {
      let custom;
      before( () => {
        custom = getConfig({
          version: '1.2.0-custom.5',
          name: 'hadron',
          product_name: 'Hadron',
          platform: 'win32',
          author: 'MongoDB Inc'
        });
      });

      it('should append the channel name to the product name', () => {
        let versionString = custom.packagerOptions['version-string'];
        expect(versionString.ProductName).to.equal('MongoDB Compass Enterprise super long test name Custom');
      });

      it('should include the channel name in asset filenames', () => {
        expect(custom.windows_msi_filename).to.equal('MongoDB Compass Enterprise super long test name CustomSetup.msi');
        expect(custom.windows_setup_filename).to.equal('MongoDB Compass Enterprise super long test name CustomSetup.exe');
        expect(custom.windows_zip_filename).to.equal('MongoDB Compass Enterprise super long test name Custom-windows.zip');
        expect(custom.windows_nupkg_full_filename).to.equal('MongoDBCompassEnterprisesuperlongtestnameCustom-1.2.0-custom5-full.nupkg');
      });
    });
  });
});
