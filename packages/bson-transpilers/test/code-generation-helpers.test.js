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
    const Transpiler = javaGenerator(JavascriptVisitor);
    const transpiler = new Transpiler();
    const doc = yaml.load(javascriptjavasymbols);
    transpiler.Types = Object.assign({}, doc.BasicTypes, doc.BsonTypes);
    transpiler.Symbols = Object.assign(
      { TestFunc: { callable: 2, args: [], template: null, argsTemplate: null, id: 'TestFunc', type: null }},
      doc.BsonSymbols, doc.JSSymbols);
    transpiler.Syntax = { eos: { template: null }, eof: { template: null } };
    transpiler.SYMBOL_TYPE = doc.SymbolTypes;
    it('defaults to long', () => {
      const str = getTree('1');
      expect(transpiler.start(str)).to.equal('1L');
    });
    it('casts double to int, decimal, hex and octal', () => {
      transpiler.Symbols.TestFunc.args = [
        [transpiler.Types._integer],
        [transpiler.Types._decimal],
        [transpiler.Types._hex],
        [transpiler.Types._octal],
        [transpiler.Types._integer]
      ];
      const str = getTree('TestFunc(100, 200, 300, 400, -500)');
      expect(transpiler.start(str)).to.equal('TestFunc(100, 200d, 300, 400, -500)');
    });
    it('does not cast numeric', () => {
      transpiler.Symbols.TestFunc.args = [
        [transpiler.Types._numeric],
        [transpiler.Types._numeric],
        [transpiler.Types._numeric],
        [transpiler.Types._numeric],
        [transpiler.Types._numeric],
        [transpiler.Types._numeric],
        [transpiler.Types._numeric]
      ];
      const str = getTree(
        'TestFunc(10, 10.01, 0x6, 0o5, Number(10), Number("10"), -10)'
      );
      expect(transpiler.start(str)).to.equal(
        'TestFunc(10L, 10.01d, 0x6, 05, 10d, Double.parseDouble("10"), -10L)'
      );
    });
    it('does not cast Number', () => {
      transpiler.Symbols.TestFunc.args = [
        [transpiler.Types._numeric],
        [transpiler.Types._long],
        [transpiler.Types._decimal],
        [transpiler.Types._integer]
      ];
      const str = getTree(
        'TestFunc(Number(10), Number("10"), Number(10), Number("10"))'
      );
      expect(transpiler.start(str)).to.equal(
        'TestFunc(10d, Double.parseDouble("10"), 10d, Double.parseDouble("10"))'
      );
    });
    it('casts long, dec, hex, octal to long', () => {
      transpiler.Symbols.TestFunc.args = [
        [transpiler.Types._long],
        [transpiler.Types._long],
        [transpiler.Types._long],
        [transpiler.Types._long],
        [transpiler.Types._long]
      ];
      const str = getTree(
        'TestFunc(10, 10.01, 0x6, 0o5, -10)'
      );
      expect(transpiler.start(str)).to.equal(
        'TestFunc(10L, new Long(10.01), new Long(0x6), new Long(05), -10L)'
      );
    });
    it('casts to integer by keeping original value', () => {
      transpiler.Symbols.TestFunc.args = [
        [transpiler.Types._integer],
        [transpiler.Types._integer],
        [transpiler.Types._integer],
        [transpiler.Types._integer],
        [transpiler.Types._integer]
      ];
      const str = getTree(
        'TestFunc(10, 10.01, 0x6, 0o5, -10)'
      );
      expect(transpiler.start(str)).to.equal(
        'TestFunc(10, 10.01, 0x6, 05, -10)'
      );
    });
    it('casts long, dec, hex, octal, and Number to decimal', () => {
      transpiler.Symbols.TestFunc.args = [
        [transpiler.Types._decimal],
        [transpiler.Types._decimal],
        [transpiler.Types._decimal],
        [transpiler.Types._decimal],
        [transpiler.Types._decimal]
      ];
      const str = getTree(
        'TestFunc(10, 10.01, 0x6, 0o5, -10)'
      );
      expect(transpiler.start(str)).to.equal(
        'TestFunc(10d, 10.01d, (double) 0x6, (double) 05, -10d)'
      );
    });
    it('casts long, dec, hex, octal, and Number to hex', () => {
      transpiler.Symbols.TestFunc.args = [
        [transpiler.Types._hex],
        [transpiler.Types._hex],
        [transpiler.Types._hex],
        [transpiler.Types._hex],
        [transpiler.Types._hex]
      ];
      const str = getTree('TestFunc(10, 10.01, 0x6, 0o5, -10)');
      expect(transpiler.start(str)).to.equal(
        'TestFunc(10, 10.01, 0x6, 05, -10)'
      );
    });
    it('casts long, dec, hex, octal, and Number to octal', () => {
      transpiler.Symbols.TestFunc.args = [
        [transpiler.Types._octal],
        [transpiler.Types._octal],
        [transpiler.Types._octal],
        [transpiler.Types._octal],
        [transpiler.Types._octal]
      ];
      const str = getTree('TestFunc(10, 10.01, 0x6, 0o5, -10)');
      expect(transpiler.start(str)).to.equal(
        'TestFunc(10, 10.01, 0x6, 05, -10)'
      );
    });
    it('casts with optional', () => {
      transpiler.Symbols.TestFunc.args = [ [transpiler.Types._decimal, null] ];
      const str = getTree('TestFunc(100)');
      expect(transpiler.start(str)).to.equal('TestFunc(100d)');
    });
    it('accepts Number', () => {
      const str = getTree('Number(1)');
      expect(transpiler.start(str)).to.equal('1d');
    });
  });
});
