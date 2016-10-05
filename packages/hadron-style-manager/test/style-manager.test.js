'use strict';

const path = require('path');
const expect = require('chai').expect;
const StyleManager = require('../lib/style-manager');

describe('StyleManager', function() {
  describe('#constructor', function() {
    const cachePath = path.join(__dirname, '.compiled-less');
    const resourcePath = path.join(__dirname);
    const manager = new StyleManager(cachePath, resourcePath);

    it('sets the cache directory', function() {
      expect(manager.cache.cacheDir).to.equal(cachePath);
    });

    it('sets the resource path', function() {
      expect(manager.cache.resourcePath).to.equal(resourcePath);
    });

    it('sets the import path', function() {
      expect(manager.cache.importPaths[0]).to.equal(resourcePath);
    });
  });
});
