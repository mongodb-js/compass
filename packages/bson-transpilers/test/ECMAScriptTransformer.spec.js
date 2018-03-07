const chai = require('chai');
const expect = chai.expect;
const antlr4 = require('antlr4');
const ECMAScriptLexer = require('../lib/ECMAScriptLexer.js');
const ECMAScriptParser = require('../lib/ECMAScriptParser.js');
const ECMAScriptTransformer = require('../transformers/ECMAScriptTransformer.js');
const PrintListener = require('../printers/ECMAScriptListener.js');

describe('Generate ECMAScript AST', function() {
  const generate = function(input) {
    const chars = new antlr4.InputStream(input);
    const lexer = new ECMAScriptLexer.ECMAScriptLexer(chars);
    const tokens = new antlr4.CommonTokenStream(lexer);
    const parser = new ECMAScriptParser.ECMAScriptParser(tokens);
    parser.buildParseTrees = true;

    const tree = parser.expressionSequence();
    const transformer = new ECMAScriptTransformer();
    transformer.visitExpressionSequence(tree);

    // Print
    const listener = new PrintListener();
    return listener.buildAST(tree, parser.ruleNames);
  };

  describe('Arithmetic', function() {
    const mathres = {
      'type': 'expressionSequence',
      'node': 'ExpressionSequenceContext',
      'children': [
        {
          'type': 'singleExpression',
          'node': '',
          'children': [
            '',
            {
              'type': 'literal',
              'node': 'LiteralContext',
              'children': [
                '2'
              ]
            },
            {
              'type': 'literal',
              'node': 'LiteralContext',
              'children': [
                '3'
              ]
            }
          ]
        }
      ]
    };
    it('handles addition', () => {
      mathres.children[0].node = 'AdditiveExpressionContext';
      mathres.children[0].children[0] = '+';
      expect(generate('2 + 3')).to.deep.equal(mathres);
    });
    // TODO: is it weird it's additive?
    it('handles subtraction', () => {
      mathres.children[0].node = 'AdditiveExpressionContext';
      mathres.children[0].children[0] = '-';
      expect(generate('2 - 3')).to.deep.equal(mathres);
    });
    it('handles multiplication', () => {
      mathres.children[0].node = 'MultiplicativeExpressionContext';
      mathres.children[0].children[0] = '*';
      expect(generate('2 * 3')).to.deep.equal(mathres);
    });
    it('handles addition with strings', () => {
      mathres.children[0].node = 'AdditiveExpressionContext';
      mathres.children[0].children[0] = '+';
      mathres.children[0].children[1].children[0] = '"2"';
      mathres.children[0].children[2].children[0] = '"3"';
      expect(generate('"2" + "3"')).to.deep.equal(mathres);
    });
    // TODO: handle the rest of the math expressions
  });

  describe('Array', () => {
    const arr = {
      'type': 'expressionSequence',
      'node': 'ExpressionSequenceContext',
      'children': [
        {
          'type': 'arrayLiteral',
          'node': 'ArrayLiteralContext',
          'children': [
            ',',
            {
              'type': 'literal',
              'node': 'LiteralContext',
              'children': [
                '1'
              ]
            },
            {
              'type': 'literal',
              'node': 'LiteralContext',
              'children': [
                '2'
              ]
            }
          ]
        }
      ]
    };
    it('parses an array', function() {
      expect(generate('[1, 2]')).to.deep.equal(arr);
    });
  });
});
