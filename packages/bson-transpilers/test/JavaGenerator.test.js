const chai = require('chai');
const expect = chai.expect;
const antlr4 = require('antlr4');
const ECMAScriptLexer = require('../lib/ECMAScriptLexer.js');
const ECMAScriptParser = require('../lib/ECMAScriptParser.js');
const JavaGenerator = require('../codegeneration/JavaGenerator.js');

describe('Generate ECMAScript AST', () => {
  const generate = (input) => {
    const chars = new antlr4.InputStream(input);
    const lexer = new ECMAScriptLexer.ECMAScriptLexer(chars);
    const tokens = new antlr4.CommonTokenStream(lexer);
    const parser = new ECMAScriptParser.ECMAScriptParser(tokens);
    parser.buildParseTrees = true;
    const tree = parser.expressionSequence();

    const visitor = new JavaGenerator();
    return visitor.visitExpressionSequence(tree);
  };

  describe('literals', () => {
    const literals = [
      '"string"', 'null', 'undefined', 'true', 'false', '0',
      '1.99001', '0x4ac1', '0.12323', '/ab+c/'
    ];
    literals.map((v) => {
      it(v, () => {
        expect(generate(v)).to.equal(v);
      });
    });
    it('\'string\'', () => {
      expect(generate('\'string\'')).to.equal('"string"');
    });
  });

  describe('arithmetic', () => {
    const unary = [
      '++', '--', '+', '-', '~', '!'
    ];
    const expr = [
      '+', '-', '*', '%', '/', '<', '>', '<=', '>=', '<<', '>>', '>>>', '==',
      '===', '!==', '&', '^', '|', '&&', '||', '='
    ];
    expr.map((v) => {
      it('1' + v + '2', () => {
        expect(generate('1' + v + '2')).to.equal('1' + v + '2');
      });
    });
    unary.map((v) => {
      it(v + '2', () => {
        expect(generate(v + '2')).to.equal(v + '2');
      });
    });
  });

  describe('object', () => {
    const objs = [
      '{k: "v"}',
      '{\'k\': "v"}',
      '{"k": "v"}',
      '{"k1": 1, \'k2\': \'test\', k3: {x: 1}}'
    ];
    const javaobjs = [
      'new Document().append("k", "v")',
      'new Document().append("k", "v")',
      'new Document().append("k", "v")',
      'new Document().append("k1", 1).append("k2", "test").append("k3", new Document().append("x", 1))'
    ];
    objs.map(function(v, i) {
      it(v, () => {
        expect(generate(v)).to.equal(javaobjs[i]);
      });
    });
  });

  describe('array', () => {
    const arrays = [
      '[1,2,3]', '[[1,2],[3,4]]'
    ];
    const javaarrays = [
      'Arrays.asList(1,2,3)',
      'Arrays.asList(Arrays.asList(1,2),Arrays.asList(3,4))'
    ];
    arrays.map((v, i) => {
      it(v, () => {
        expect(generate(v)).to.equal(javaarrays[i]);
      });
    });
  });
});
