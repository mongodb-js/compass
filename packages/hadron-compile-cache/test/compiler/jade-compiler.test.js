const crypto = require('crypto');
const fs = require('fs-plus');
const path = require('path');
const chai = require('chai');
const expect = chai.expect;
const JadeCompiler = require('../../lib/compiler/jade-compiler');

describe('JadeCompiler', function() {
  describe('#getCachePath', function() {
    const compiler = new JadeCompiler();
    const file = path.join(__dirname, 'test.jade');
    const expected = path.join(
      'jade',
      crypto.createHash('sha1').update(file, 'utf8').digest('hex') + '.js'
    );

    it('returns the digested cache path', function() {
      expect(compiler.getCachePath(file)).to.equal(expected);
    });
  });

  describe('#compile', function() {
    const compiler = new JadeCompiler();
    const filePath = path.join(__dirname, 'test.jade');
    const source = fs.readFileSync(filePath, 'utf8');
    const compiled = compiler.compile(source, filePath);

    it('creates the template function', function() {
      expect(compiled).to.include('function template(locals) {');
    });

    it('compiles the source', function() {
      expect(compiled).to.include('<div id=\\"testing\\"></div>');
    });

    it('requires the jade runtime', function() {
      expect(compiled).to.include('var jade = require("@lukekarrys/jade-runtime");');
    });

    it('exports the module function', function() {
      expect(compiled).to.include('module.exports = template;');
    });
  });
});
