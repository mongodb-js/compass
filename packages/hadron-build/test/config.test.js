'use strict';
/* eslint no-unused-vars: 1 */
const _ = require('lodash');
const config = require('../lib/config');
const chai = require('chai');
const expect = chai.expect;

const getConfig = (argv) => {
  const cli = require('mongodb-js-cli')('hadron-build:config');
  const defaults = _.mapValues(config.options, (v) => v.default);
  _.defaults(argv, defaults);
  cli.argv = argv;
  return config.get(cli);
};

describe('hadron-build::config', () => {
  describe('::darwin', () => {
    describe('::stable channel', () => {
      let res;
      before( () => {
        res = getConfig({
          version: '1.2.0',
          product_name: 'Hadron',
          app_bundle_id: 'com.mongodb.hadron',
          platform: 'darwin'
        });
      });
      it('should have the correct product name', () => {
        expect(res.packagerOptions.name).to.equal('Hadron');
      });
      it('should have the correct app-bundle-id', () => {
        expect(res.packagerOptions['app-bundle-id']).to.equal('com.mongodb.hadron');
      });
    });

    describe('::beta channel', () => {
      let res = getConfig({
        version: '1.2.0-beta.1',
        product_name: 'Hadron',
        app_bundle_id: 'com.mongodb.hadron',
        platform: 'darwin'
      });
      it('should have the correct product name', () => {
        expect(res.packagerOptions.name).to.equal('Hadron Beta');
      });
      it('should have the correct app-bundle-id', () => {
        expect(res.packagerOptions['app-bundle-id']).to.equal('com.mongodb.hadron.beta');
      });
    });
  });

  describe('::win32', () => {
    describe('::stable channel', () => {
      let res;
      before( () => {
        res = getConfig({
          version: '1.2.0',
          product_name: 'Hadron',
          platform: 'win32',
          author: 'MongoDB Inc'
        });
      });
      it('should have the platform specific packager options', () => {
        let versionString = res.packagerOptions['version-string'];
        expect(versionString).to.be.a('object');
        expect(versionString.CompanyName).to.equal('MongoDB Inc');
        expect(versionString.FileDescription).to.be.a('string');
        expect(versionString.ProductName).to.be.a('string');
        expect(versionString.InternalName).to.be.a('string');
      });

      it('should have the platform specific evergreen expansions', () => {
        expect(res.windows_msi_filename).to.equal('HadronSetup.msi');
        expect(res.windows_setup_filename).to.equal('HadronSetup.exe');
        expect(res.windows_zip_filename).to.equal('Hadron-windows.zip');
        expect(res.windows_nupkg_full_filename).to.equal('Hadron-1.2.0-full.nupkg');
        expect(res.windows_nupkg_full_label).to.equal('Hadron-1.2.0-full.nupkg');
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
    });
  });
  describe('::custom channel', () => {
    let res;
    before( () => {
      res = getConfig({
        version: '1.2.0-custom.5',
        name: 'hadron',
        product_name: 'Hadron',
        platform: 'win32',
        author: 'MongoDB Inc'
      });
    });
    it('should append the channel name to the product name', () => {
      expect(res.productName).to.equal('Hadron Custom');
      let versionString = res.packagerOptions['version-string'];
      expect(versionString.ProductName).to.equal('Hadron Custom');
    });
    it('should have the correct asset filenames', () => {
      expect(res.windows_msi_filename).to.equal('Hadron CustomSetup.msi');
      expect(res.windows_setup_filename).to.equal('Hadron CustomSetup.exe');
      expect(res.windows_zip_filename).to.equal('Hadron Custom-windows.zip');
      expect(res.windows_nupkg_full_filename).to.equal('Hadron-1.2.0-custom5-full.nupkg');
    });
  });
  describe('::beta channel', () => {
    let res;
    before( () => {
      res = getConfig({
        version: '1.2.0-beta.1',
        name: 'hadron',
        product_name: 'Hadron',
        platform: 'win32',
        author: 'MongoDB Inc'
      });
    });
    it('should append the channel name to the product name', () => {
      expect(res.productName).to.equal('Hadron Beta');
      let versionString = res.packagerOptions['version-string'];
      expect(versionString.ProductName).to.equal('Hadron Beta');
      // expect(versionString.InternalName).to.equal('hadron-beta');
    });

    it('should have the correct asset filenames', () => {
      expect(res.windows_msi_filename).to.equal('Hadron BetaSetup.msi');
      expect(res.windows_setup_filename).to.equal('Hadron BetaSetup.exe');
      expect(res.windows_zip_filename).to.equal('Hadron Beta-windows.zip');
      expect(res.windows_nupkg_full_filename).to.equal('Hadron-1.2.0-beta1-full.nupkg');
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
  });
});
