'use strict';

const fs = require('fs');
const path = require('path');
const expect = require('chai').expect;
const StyleManager = require('../lib/style-manager');

describe('StyleManager', () => {
  describe('#build', () => {
    const cachePath = path.join(__dirname, '.compiled-less');
    const resourcePath = path.join(__dirname);
    const htmlTemplatePath = path.join(__dirname, 'test.html.template');
    const htmlPath = path.join(__dirname, 'test.html');
    const lessPath = path.join(__dirname, 'test.less');
    const manager = new StyleManager(cachePath, resourcePath);

    before(() => {
      fs.createReadStream(htmlTemplatePath).pipe(fs.createWriteStream(htmlPath));
    });

    after((done) => {
      fs.unlink(htmlPath, done());
    });

    it('writes the css into the head of the html', (done) => {
      manager.build(htmlPath, lessPath, (error, html) => {
        expect(error).to.equal(null);
        expect(html).to.include('color: red;');
        done();
      });
    });
  });

  describe('#constructor', () => {
    const cachePath = path.join(__dirname, '.compiled-less');
    const resourcePath = path.join(__dirname);
    const manager = new StyleManager(cachePath, resourcePath);

    it('sets the cache directory', () => {
      expect(manager.cache.cacheDir).to.equal(cachePath);
    });

    it('sets the resource path', () => {
      expect(manager.cache.resourcePath).to.equal(resourcePath);
    });

    it('sets the import path', () => {
      expect(manager.cache.importPaths[0]).to.equal(resourcePath);
    });
  });
});
