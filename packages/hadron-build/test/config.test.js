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

describe('hadron-build::config::darwin', () => {
  describe('::channel', () => {
    describe('::stable', () => {
      let res = getConfig({
        version: '1.2.0',
        product_name: 'Hadron',
        app_bundle_id: 'com.mongodb.hadron',
        platform: 'darwin'
      });
      // packagerOptions:
      //  { dir: '/Users/lucas/hadron-build',
      //    out: '/Users/lucas/hadron-build/dist',
      //    overwrite: true,
      //    'app-copyright': '2016 undefined',
      //    'build-version': '1.2.0',
      //    'app-version': '1.2.0',
      //    ignore: 'node_modules/|.cache/|dist/|test/|.user-data',
      //    platform: 'darwin',
      //    arch: 'x64',
      //    version: '0.36.12',
      //    sign: null,
      //    name: 'Hadron',
      //    icon: '/Users/lucas/hadron-build/hadron-build.icns',
      //    'app-bundle-id': 'com.mongodb.hadron',
      //    'app-category-type': 'public.app-category.productivity',
      //    protocols: [] },
      it('should have the correct product name', () => {
        expect(res.packagerOptions.name).to.equal('Hadron');
      });
      it('should have the correct app-bundle-id', () => {
        expect(res.packagerOptions['app-bundle-id']).to.equal('com.mongodb.hadron');
      });
    });

    describe('::beta', () => {
      let res = getConfig({
        version: '1.2.0-beta.1',
        product_name: 'Hadron',
        app_bundle_id: 'com.mongodb.hadron',
        platform: 'darwin'
      });
      //   packagerOptions:
      //  { dir: '/Users/lucas/hadron-build',
      //    out: '/Users/lucas/hadron-build/dist',
      //    overwrite: true,
      //    'app-copyright': '2016 undefined',
      //    'build-version': '1.2.0-beta.1',
      //    'app-version': '1.2.0-beta.1',
      //    ignore: 'node_modules/|.cache/|dist/|test/|.user-data',
      //    platform: 'darwin',
      //    arch: 'x64',
      //    version: '0.36.12',
      //    sign: null,
      //    name: 'Hadron Beta',
      //    icon: '/Users/lucas/hadron-build/hadron-build.icns',
      //    'app-bundle-id': 'com.mongodb.hadron.beta',
      //    'app-category-type': 'public.app-category.productivity',
      //    protocols: [] },
      it('should have the correct product name', () => {
        expect(res.packagerOptions.name).to.equal('Hadron Beta');
      });
      it('should have the correct app-bundle-id', () => {
        expect(res.packagerOptions['app-bundle-id']).to.equal('com.mongodb.hadron.beta');
      });
    });
  });
});

describe('hadron-build::config::win32', () => {
  let res;

  it('should build the config', () => {
    res = getConfig({
      version: '1.2.0',
      product_name: 'Hadron',
      app_bundle_id: 'com.mongodb.hadron',
      platform: 'win32',
      author: 'MongoDB Inc'
    });
  });
  //   packagerOptions:
  //  { dir: '/Users/lucas/hadron-build',
  //    out: '/Users/lucas/hadron-build/dist',
  //    overwrite: true,
  //    'app-copyright': '2016 MongoDB Inc',
  //    'build-version': '1.2.0',
  //    'app-version': '1.2.0',
  //    ignore: 'node_modules/|.cache/|dist/|test/|.user-data',
  //    platform: 'win32',
  //    arch: 'x64',
  //    version: '0.36.12',
  //    sign: null,
  //    name: 'Hadron',
  //    icon: undefined,
  //    'version-string':
  //     { CompanyName: 'MongoDB Inc',
  //       FileDescription: 'Tooling for Hadron apps.',
  //       ProductName: 'Hadron',
  //       InternalName: 'hadron-build' } },
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
    expect(res.windows_msi_label).to.equal('Windows Installer Package');
    expect(res.windows_setup_filename).to.equal('HadronSetup.exe');
    expect(res.windows_setup_label).to.equal('Windows Installer');
    expect(res.windows_zip_filename).to.equal('Hadron-windows.zip');
    expect(res.windows_zip_label).to.equal('Windows Zip');
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
  //  { loadingGif: undefined,
  //    signWithParams: null,
  //    iconUrl: undefined,
  //    appDirectory: '/Users/lucas/hadron-build/dist/Hadron-win32-x64',
  //    outputDirectory: '/Users/lucas/hadron-build/dist',
  //    authors: 'MongoDB Inc',
  //    version: '1.2.0',
  //    exe: 'Hadron.exe',
  //    setupExe: 'HadronSetup.exe',
  //    title: 'Hadron',
  //    productName: 'Hadron',
  //    description: 'Tooling for Hadron apps.',
  //    name: 'Hadron'},
  });
});
