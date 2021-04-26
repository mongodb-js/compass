var babel = require('babel-core');
var fs = require('fs-plus');
var path = require('path');
var chai = require('chai');
var expect = chai.expect;
var BabelCompiler = require('../../lib/compiler/babel-compiler');

describe('BabelCompiler', function() {
  describe('#new', function() {
    var compiler = new BabelCompiler();
    var version = require('babel-core/package.json').version;
    var defaults = BabelCompiler.DEFAULTS;
    var expectedPath = path.join('js', 'babel', compiler._createDigest(version, defaults));

    it('sets the babel version directory', function() {
      expect(compiler.versionDirectory).to.equal(expectedPath);
    });
  });

  describe('#getCachePath', function() {
    var compiler = new BabelCompiler();
    var file = fs.readFileSync(path.join(__dirname, 'test.jsx'), 'utf8');
    var defaults = BabelCompiler.DEFAULTS;
    var source = babel.transform(file, defaults).code;
    var version = require('babel-core/package.json').version;
    var versionDir = path.join('js', 'babel', compiler._createDigest(version, defaults));
    var expected = path.join(versionDir, '90fec0caffa65c1db6422fa4aa2d7c6ba2c954f6.js');

    it('returns the digested cache path', function() {
      expect(compiler.getCachePath(source)).to.equal(expected);
    });
  });

  describe('#compile', function() {
    var compiler = new BabelCompiler();
    var filePath = path.join(__dirname, 'test.jsx');
    var source = fs.readFileSync(filePath, 'utf8');
    var compiled = compiler.compile(source, filePath);

    it('creates the template function', function() {
      expect(compiled).to.include('function test() {');
    });

    it('compiles the source', function() {
      expect(compiled).to.include('return React.createElement("div", null);');
    });

    it('exports the module function', function() {
      expect(compiled).to.include('module.exports = test;');
    });
  });
});
