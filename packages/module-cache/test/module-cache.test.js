var path = require('path');
var os = require('os');
var fs = require('fs-plus');
var chai = require('chai');
var expect = chai.expect;
var ModuleCache = require('../lib/module-cache');
var root = path.join(__dirname, '..');
var pkgPath = path.join(root, 'package.json');

describe('ModuleCache', function() {
  describe('#create', function() {
    var originalMetadata = JSON.parse(fs.readFileSync(pkgPath));
    var cache = null;

    before(function() {
      ModuleCache.create(root);
      cache = JSON.parse(fs.readFileSync(pkgPath))._compassModuleCache;
    });

    after(function() {
      fs.writeFileSync(pkgPath, JSON.stringify(originalMetadata, null, 2) + os.EOL);
    });

    it('generates a version for the cache', function() {
      expect(cache.version).to.equal(1);
    });

    it('generates an extension map', function() {
      expect(cache.extensions['.js']).to.not.be.empty;
    });
  });

  describe('#register', function() {
    var cache = ModuleCache.cache;

    before(function() {
      process.resourcesPath = root;
      ModuleCache.register(root);
    });

    after(function() {
      process.resourcesPath = null;
    });

    it('registers the cache', function() {
      expect(cache.registered).to.equal(true);
    });

    it('sets the cache resource paths', function() {
      expect(cache.resourcePath).to.equal(root);
      expect(cache.resourcePathWithTrailingSlash).to.equal(root + path.sep);
    });
  });

  describe('#add', function() {
    var cache = ModuleCache.cache;

    before(function() {
      ModuleCache.add(root);
    });

    it('adds the extensions the cache', function() {
      expect(cache.extensions).to.be.empty;
    });
  });
});
