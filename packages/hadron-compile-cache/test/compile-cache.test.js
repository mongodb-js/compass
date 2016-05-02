var path = require('path');
var fs = require('fs-plus');
var chai = require('chai');
var expect = chai.expect;
var CompileCache = require('../lib/compile-cache');
var JadeCompiler = require('../lib/compiler/jade-compiler');

describe('CompileCache', function() {
  describe('#new', function() {
    it('does not initialize the cache directory', function() {
      expect(CompileCache.cacheDirectory).to.equal(null);
    });
  });

  describe('#setHomeDirectory', function() {
    var home = path.join(__dirname);

    beforeEach(function() {
      CompileCache.setHomeDirectory(home);
    });

    afterEach(function() {
      CompileCache.cacheDirectory = null;
      CompileCache.homeDirectory = null;
    });

    it('sets the cache directory under the home dir', function() {
      expect(CompileCache.cacheDirectory).to.equal(path.join(home, '.compiled-sources'));
    });
  });

  describe('#compileFileAtPath', function() {
    var compiler = new JadeCompiler();
    var filePath = path.join(__dirname, 'compiler', 'test.jade');
    var home = path.join(__dirname);
    var filename = '3db75a24664929212b3e9c8aa34528976f205cb8.js';
    var cachePath = path.join(home, '.compiled-sources');
    var cachedFilePath = path.join(cachePath, 'jade', filename);

    beforeEach(function() {
      CompileCache.setHomeDirectory(home);
      CompileCache.compileFileAtPath(compiler, filePath);
    });

    afterEach(function() {
      CompileCache.cacheDirectory = null;
      CompileCache.homeDirectory = null;
      fs.removeSync(cachePath);
    });

    it('compiles the source and saves in the cache directory', function() {
      var file = fs.readFileSync(cachedFilePath, 'utf8');
      expect(file).to.not.equal(null);
    });
  });

  describe('.COMPILERS', function() {
    it('includes the jade compiler', function() {
      expect(CompileCache.COMPILERS['.jade']).to.be.a('object');
    });

    it('includes the babel compiler', function() {
      expect(CompileCache.COMPILERS['.jsx']).to.be.a('object');
    });
  });

  describe('._shorten', function() {
    var home = path.join(__dirname);
    var relativePath = path.join('src', 'app', 'connect', 'test.js');
    var filePath = path.join(home, relativePath);

    beforeEach(function() {
      CompileCache.setHomeDirectory(home);
    });

    afterEach(function() {
      CompileCache.cacheDirectory = null;
      CompileCache.homeDirectory = null;
    });

    it('strips the home directory from the front of the path', function() {
      expect(CompileCache._shorten(filePath)).to.equal(path.sep + relativePath);
    });
  });
});
