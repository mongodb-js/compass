const babel = require('babel-core');
const { promises: fs } = require('fs');
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

  describe('#getCachePath', async function() {
    const compiler = new BabelCompiler();
    const file = await fs.readFile(path.join(__dirname, 'test.jsx'), 'utf8');
    const defaults = BabelCompiler.DEFAULTS;
    const source = babel.transform(file, defaults).code;
    const version = require('babel-core/package.json').version;
    const versionDir = path.join('js', 'babel', compiler._createDigest(version, defaults));
    const expected = path.join(versionDir, '3d5a49cec27deccc9bc9cc84e3a847d65ec6282c.js');

    it('returns the digested cache path', function() {
      expect(compiler.getCachePath(source)).to.equal(expected);
    });
  });

  describe('#compile', async function() {
    const compiler = new BabelCompiler();
    const filePath = path.join(__dirname, 'test.jsx');
    const source = await fs.readFile(filePath, 'utf8');
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
