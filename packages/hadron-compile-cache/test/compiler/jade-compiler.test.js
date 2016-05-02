var jade = require('jade');
var fs = require('fs-plus');
var path = require('path');
var chai = require('chai');
var expect = chai.expect;
var JadeCompiler = require('../../lib/compiler/jade-compiler');

describe('JadeCompiler', function() {
  describe('#getCachePath', function() {
    var compiler = new JadeCompiler();
    var file = fs.readFileSync(path.join(__dirname, 'test.jade'), 'utf8');
    var source = jade.compileClient(file);
    var expected = 'jade/af5d879c7a5a8c4448e6a3c000f87238ee3351c8.js';

    it('returns the digested cache path', function() {
      expect(compiler.getCachePath(source)).to.equal(expected);
    });
  });

  describe('#compile', function() {
    var compiler = new JadeCompiler();
    var filePath = path.join(__dirname, 'test.jade');
    var source = fs.readFileSync(filePath, 'utf8');
    var compiled = compiler.compile(source, filePath);

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
