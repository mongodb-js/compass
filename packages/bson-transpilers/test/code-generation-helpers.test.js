const path = require('path');
const chai = require('chai');
const expect = chai.expect;
const {
  doubleQuoteStringify,
  singleQuoteStringify,
  removeQuotes
} = require(path.resolve('helper', 'format'));

const { getTree } = require('../');
const yaml = require('js-yaml');
const JavascriptVisitor = require('../codegeneration/javascript/Visitor');
const javaGenerator = require('../codegeneration/java/Generator');
const javascriptjavasymbols = require('../lib/symbol-table/javascripttojava');

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
  describe('castTo', () => {
    const Compiler = javaGenerator(JavascriptVisitor);
    const compiler = new Compiler();
    const doc = yaml.load(javascriptjavasymbols);
    compiler.Types = Object.assign({}, doc.BasicTypes, doc.BsonTypes);
    compiler.Symbols = Object.assign(
      { TestFunc: { callable: 2, args: [], template: null, argsTemplate: null, id: 'TestFunc', type: null }},
      doc.BsonSymbols, doc.JSSymbols);
    compiler.SYMBOL_TYPE = doc.SymbolTypes;
    it('defaults to long', () => {
      const str = getTree('1');
      expect(compiler.start(str)).to.equal('new java.lang.Long(\"1\")');
    });
    it('casts long to int, decimal, hex and octal', () => {
      const str = getTree('TestFunc(100, 200, 300, 400)');
      compiler.Symbols.TestFunc.args = [
        [compiler.Types._integer],
        [compiler.Types._decimal],
        [compiler.Types._hex],
        [compiler.Types._octal]
      ];
      expect(compiler.start(str)).to.equal('TestFunc(100, new java.lang.Double(200), 300, 400)');
    });
    it('does not cast numeric', () => {
      const str = getTree('TestFunc(10, 10.01, 0x6, 0o5)');
      compiler.Symbols.TestFunc.args = [
        [compiler.Types._numeric],
        [compiler.Types._numeric],
        [compiler.Types._numeric],
        [compiler.Types._numeric]
      ];
      expect(compiler.start(str)).to.equal('TestFunc(new java.lang.Long(\"10\"), new java.lang.Double(10.01), 0x6, 05)');
    });
    it('casts long, dec, hex, octal, and Number to long', () => {
      const str = getTree('TestFunc(10, 10.01, 0x6, 0o5, Number(99))');
      compiler.Symbols.TestFunc.args = [
        [compiler.Types._long],
        [compiler.Types._long],
        [compiler.Types._long],
        [compiler.Types._long],
        [compiler.Types._long]
      ];
      expect(compiler.start(str)).to.equal('TestFunc(new java.lang.Long(\"10\"), new java.lang.Long(10.01), new java.lang.Long(0x6), new java.lang.Long(0o5), new java.lang.Long(\"99\"))');
    });
    it('casts with optional', () => {
      const str = getTree('TestFunc(100)');
      compiler.Symbols.TestFunc.args = [ [compiler.Types._decimal, null] ];
      expect(compiler.start(str)).to.equal('TestFunc(new java.lang.Double(100))');
    });
    it('accepts Number', () => {
      const str = getTree('Number(1)');
      expect(compiler.start(str)).to.equal('new java.lang.Long(\"1\")');
    });
  });
});
