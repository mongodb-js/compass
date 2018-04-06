const path = require('path');
const chai = require('chai');
const expect = chai.expect;
const {
  doubleQuoteStringify,
  singleQuoteStringify,
  removeQuotes
} = require(path.resolve('helper', 'format'));

describe('CodeGeneration helper functions', () => {
  describe('doubleQuoteStringify', () => {
    it('accepts double quotes', () => {
      expect(doubleQuoteStringify('"quote"')).to.equal('"quote"');
    });
    it('accepts single quotes', () => {
      expect(doubleQuoteStringify('\'quote\'')).to.equal('"quote"');
    });
    it('accepts no quotes', () => {
      expect(doubleQuoteStringify('quote')).to.equal('"quote"');
    });
    it('escapes double quotes', () => {
      expect(doubleQuoteStringify('""double" \'single\' \n"')).to.equal('"\\"double\\" \'single\' \n"');
    });
  });
  describe('singleQuoteStringify', () => {
    it('accepts double quotes', () => {
      expect(singleQuoteStringify('"quote"')).to.equal("'quote'");
    });
    it('accepts single quotes', () => {
      expect(singleQuoteStringify('\'quote\'')).to.equal("'quote'");
    });
    it('accepts no quotes', () => {
      expect(singleQuoteStringify('quote')).to.equal("'quote'");
    });
    it('escapes single quotes', () => {
      expect(singleQuoteStringify('""double" \'single\' \n"')).to.equal('\'"double" \\\'single\\\' \n\'');
    });
  });
  describe('removeQuotes', () => {
    it('accepts double quotes', () => {
      expect(removeQuotes('"quote"')).to.equal('quote');
    });
    it('accepts single quotes', () => {
      expect(removeQuotes('\'quote\'')).to.equal('quote');
    });
    it('accepts no quotes', () => {
      expect(removeQuotes('quote')).to.equal('quote');
    });
    it('escapes chars', () => {
      expect(removeQuotes('"double" \'single\' \n"')).to.equal('double" \'single\' \n');
    });
  });
});
