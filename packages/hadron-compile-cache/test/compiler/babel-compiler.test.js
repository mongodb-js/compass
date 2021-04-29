const babel = require('babel-core');
const fs = require('fs-plus');
const path = require('path');
const chai = require('chai');
const expect = chai.expect;
const BabelCompiler = require('../../lib/compiler/babel-compiler');

describe('BabelCompiler', function() {
  describe('#new', function() {
    const compiler = new BabelCompiler();
    const version = require('babel-core/package.json').version;
    const defaults = BabelCompiler.DEFAULTS;
    const expectedPath = path.join('js', 'babel', compiler._createDigest(version, defaults));

    it('sets the babel version directory', function() {
      expect(compiler.versionDirectory).to.equal(expectedPath);
    });
  });

  describe('#getCachePath', function() {
    const compiler = new BabelCompiler();
    const file = fs.readFileSync(path.join(__dirname, 'test.jsx'), 'utf8');
    const defaults = BabelCompiler.DEFAULTS;
    const source = babel.transform(file, defaults).code;
    const version = require('babel-core/package.json').version;
    const versionDir = path.join('js', 'babel', compiler._createDigest(version, defaults));
    const expected = path.join(versionDir, '90fec0caffa65c1db6422fa4aa2d7c6ba2c954f6.js');

    it('returns the digested cache path', function() {
      expect(compiler.getCachePath(source)).to.equal(expected);
    });
  });

  describe('#compile', function() {
    const compiler = new BabelCompiler();
    const filePath = path.join(__dirname, 'test.jsx');
    const source = fs.readFileSync(filePath, 'utf8');
    const compiled = compiler.compile(source, filePath);

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
