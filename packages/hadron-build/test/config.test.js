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
