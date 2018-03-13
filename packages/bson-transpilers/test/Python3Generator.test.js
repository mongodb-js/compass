const chai = require('chai');
const expect = chai.expect;
const antlr4 = require('antlr4');
const ECMAScriptLexer = require('../lib/ECMAScriptLexer.js');
const ECMAScriptParser = require('../lib/ECMAScriptParser.js');
const Python3Generator = require('../codegeneration/Python3Generator.js');

describe('Generate ECMAScript AST', () => {
  const generate = (input) => {
    const chars = new antlr4.InputStream(input);
    const lexer = new ECMAScriptLexer.ECMAScriptLexer(chars);
    const tokens = new antlr4.CommonTokenStream(lexer);
    const parser = new ECMAScriptParser.ECMAScriptParser(tokens);
    parser.buildParseTrees = true;
    const tree = parser.expressionSequence();

    const visitor = new Python3Generator();
    return visitor.visitExpressionSequence(tree);
  };

  describe('literals', () => {
    const literals = [
      '"string"', '\'string\'', 'null', 'undefined', 'true', 'false', '0',
      '1.99001', '0x4ac1', '0.12323', '/ab+c/'
    ];
    literals.map((v) => {
      it(v, () => {
        expect(generate(v)).to.equal(v);
      });
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

  describe('array', () => {
    const arrays = [
      '[1,2,3]', '[[1,2],[3,4]]'
    ];
    arrays.map((v) => {
      it(v, () => {
        expect(generate(v)).to.equal(v);
      });
    });
  });

  describe('object', () => {
    const objs = [
      '{k:1}', '{k:[1,2]}', '{k:{k2:1}}', '[{k:1},{k2:2}]', '{k:{k2:{k3:{k4:1,k5:2}}}}'
    ];
    const pyobjs = [
      '{\'k\':1}', '{\'k\':[1,2]}', '{\'k\':{\'k2\':1}}', '[{\'k\':1},{\'k2\':2}]',
      '{\'k\':{\'k2\':{\'k3\':{\'k4\':1,\'k5\':2}}}}'
    ];
    objs.map(function(v, i) {
      it(v, () => {
        expect(generate(v)).to.equal(pyobjs[i]);
      });
    });
  });

  describe('BSON classes', () => {
    it('new', () => {
      expect(generate('new ObjectId()')).to.equal('ObjectId()');
    });
    // it('Long --> Int64', () => {
    //   expect(generate('Long(1)')).to.equal('Int64(1)');
    // });
    it('ISODate --> datetime.date', () => {
      expect(generate('ISODate(\'1982-09-09\')')).to.equal('datetime.date(\'1982-09-09\')');
    });
  });
});
