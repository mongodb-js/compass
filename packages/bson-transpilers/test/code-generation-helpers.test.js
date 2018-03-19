const chai = require('chai');
const expect = chai.expect;
const CodeGenerator = require('../codegeneration/CodeGenerator');

describe('CodeGeneration helper functions', () => {
  let gen;
  before(() => {
    gen = new CodeGenerator();
  });
  describe('doubleQuoteStringify', () => {
    it('accepts double quotes', () => {
      expect(gen.doubleQuoteStringify('"quote"')).to.equal('"quote"');
    });
    it('accepts single quotes', () => {
      expect(gen.doubleQuoteStringify('\'quote\'')).to.equal('"quote"');
    });
    it('accepts no quotes', () => {
      expect(gen.doubleQuoteStringify('quote')).to.equal('"quote"');
    });
    it('escapes double quotes', () => {
      expect(gen.doubleQuoteStringify('""double" \'single\' \n"')).to.equal('"\\"double\\" \'single\' \n"');
    });
  });
  describe('singleQuoteStringify', () => {
    it('accepts double quotes', () => {
      expect(gen.singleQuoteStringify('"quote"')).to.equal("'quote'");
    });
    it('accepts single quotes', () => {
      expect(gen.singleQuoteStringify('\'quote\'')).to.equal("'quote'");
    });
    it('accepts no quotes', () => {
      expect(gen.singleQuoteStringify('quote')).to.equal("'quote'");
    });
    it('escapes single quotes', () => {
      expect(gen.singleQuoteStringify('""double" \'single\' \n"')).to.equal('\'"double" \\\'single\\\' \n\'');
    });
  });
  describe('removeQuotes', () => {
    it('accepts double quotes', () => {
      expect(gen.removeQuotes('"quote"')).to.equal('quote');
    });
    it('accepts single quotes', () => {
      expect(gen.removeQuotes('\'quote\'')).to.equal('quote');
    });
    it('accepts no quotes', () => {
      expect(gen.removeQuotes('quote')).to.equal('quote');
    });
    it('escapes chars', () => {
      expect(gen.removeQuotes('"double" \'single\' \n"')).to.equal('double" \'single\' \n');
    });
  });
});
