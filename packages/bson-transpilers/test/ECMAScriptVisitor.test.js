const chai = require('chai');
const expect = chai.expect;
const antlr4 = require('antlr4');
const ECMAScriptLexer = require('../lib/ECMAScriptLexer.js');
const ECMAScriptParser = require('../lib/ECMAScriptParser.js');
const ECMAScriptVisitor = require('../codegeneration/ECMAScriptVisitor.js');

describe('Generate ECMAScript AST', function() {
  const generate = function(input) {
    const chars = new antlr4.InputStream(input);
    const lexer = new ECMAScriptLexer.ECMAScriptLexer(chars);
    const tokens = new antlr4.CommonTokenStream(lexer);
    const parser = new ECMAScriptParser.ECMAScriptParser(tokens);
    parser.buildParseTrees = true;
    const tree = parser.expressionSequence();

    const visitor = new ECMAScriptVisitor();
    return visitor.visitExpressionSequence(tree);
  };

  describe('literals', function() {
    const literals = [
      '"string"', '\'string\'', 'null', 'undefined', 'true', 'false', '0',
      '1.99001', '0x4ac1', '0.12323', '/ab+c/'
    ];
    literals.map(function(v) {
      it(v, function() {
        expect(generate(v)).to.equal(v);
      });
    });
  });

  describe('arithmetic', function() {
    const unary = [
      '++', '--', '+', '-', '~', '!'
    ];
    const expr = [
      '+', '-', '*', '%', '/', '<', '>', '<=', '>=', '<<', '>>', '>>>', '==',
      '===', '!==', '&', '^', '|', '&&', '||', '='
    ];
    expr.map(function(v) {
      it('1' + v + '2', function() {
        expect(generate('1' + v + '2')).to.equal('1' + v + '2');
      });
    });
    unary.map(function(v) {
      it(v + '2', function() {
        expect(generate(v + '2')).to.equal(v + '2');
      });
    });
  });

  describe('array', function() {
    const arrays = [
      '[1,2,3]', '[[1,2],[3,4]]', '[{k:1},{k2:2}]'
    ];
    arrays.map(function(v) {
      it(v, function() {
        expect(generate(v)).to.equal(v);
      });
    });
  });

  describe('object', function() {
    const objs = [
      '{k:1}', '{k:[1,2]}', '{k:{k2:1}}'
    ];
    objs.map(function(v) {
      it(v, function() {
        expect(generate(v)).to.equal(v);
      });
    });
  });
});
