const crypto = require('crypto');
const fs = require('fs-plus');
const path = require('path');
const chai = require('chai');
const expect = chai.expect;
const MarkdownCompiler = require('../../lib/compiler/markdown-compiler');

describe('MarkdownCompiler', function() {
  describe('#getCachePath', function() {
    const compiler = new MarkdownCompiler();
    const file = path.join(__dirname, 'test.md');
    const expected = path.join(
      'md',
      crypto.createHash('sha1').update(file, 'utf8').digest('hex') + '.js'
    );

    it('returns the digested cache path', function() {
      expect(compiler.getCachePath(file)).to.equal(expected);
    });
  });

  describe('#compile', function() {
    const compiler = new MarkdownCompiler();
    const filePath = path.join(__dirname, 'test.md');
    const source = fs.readFileSync(filePath, 'utf8');
    const compiled = compiler.compile(source, filePath);

    it('creates the template function', function() {
      expect(compiled).to.include('module.exports = {');
    });

    it('creates the header', function() {
      expect(compiled).to.include('<h3 id=\\"test-title\\">Test Title</h3>');
    });

    it('creates the text node', function() {
      expect(compiled).to.include('<p>Test text.</p>');
    });

    it('closes the object', function() {
      expect(compiled).to.include('};');
    });
  });
});
