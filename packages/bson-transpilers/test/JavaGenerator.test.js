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
      '1.99001', '0x4ac1', '0.12323'
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

  describe('BSON Types', () => {
    const js = [
      "new Code('string')", 'new Code("string")', 'Code("string")',
      'Code(function(test) { console.log(test); })', "Code('string', {x: 1})",

      'new ObjectId()', 'ObjectId()', "ObjectId('00000001d794e4d3323b45f1')",
      "new ObjectId('00000001d794e4d3323b45f1')",

      'new Binary(Buffer.from("a string"))', 'new Binary(Buffer.from("a string"), Binary.SUBTYPE_UUID)',
      'Binary(Buffer.from("a string"), 4)',

      'new DBRef("coll", new ObjectId())', 'DBRef("coll", ObjectId(), "db")',

      'new Double(1)', 'Double("1")',

      'new Long(-1, 2147483647)',

      'new MinKey()', 'new MaxKey()', 'MinKey()', 'MaxKey()',

      'new Date(\'December 17, 1995 03:24:00\')', 'new Date(819167040000)',

      // "new RegExp(/[-a-zA-Z0-9@:%_\\+.~#?&//=]{2,256}\\.[a-z]{2,4}\\b(\\/[-a-zA-Z0-9@:%_\\+.~#?&//=]*)?/gi)",
      // "/[-a-zA-Z0-9@:%_\\+.~#?&//=]{2,256}\\.[a-z]{2,4}\\b(\\/[-a-zA-Z0-9@:%_\\+.~#?&//=]*)?/gi",
      // "new BSONRegExp(/[-a-zA-Z0-9@:%_\\+.~#?&//=]{2,256}\\.[a-z]{2,4}\\b(\\/[-a-zA-Z0-9@:%_\\+.~#?&//=]*)?/gi)",

      'new Symbol(\'test\')', 'Symbol("test")'
    ];
    const java = [
      'new Code("string")', 'new Code("string")', 'new Code("string")',
      'new Code("function(test){console.log(test);}")',
      'new CodeWithScope("string", new Document().append("x", 1))',

      'new ObjectId()', 'new ObjectId()',
      'new ObjectId("00000001d794e4d3323b45f1")',
      'new ObjectId("00000001d794e4d3323b45f1")',

      'new Binary(org.bson.BsonBinarySubType.BINARY, "a string".getBytes("UTF-8"))',
      'new Binary(org.bson.BsonBinarySubType.UUID, "a string".getBytes("UTF-8"))',
      'new Binary(org.bson.BsonBinarySubType.UUID, "a string".getBytes("UTF-8"))',

      'new DBRef("coll", new ObjectId())', 'new DBRef("coll", new ObjectId(), "db")',

      'new java.lang.Double(1)', 'new java.lang.Double("1")',

      'new java.lang.Long("9223372036854775807")',

      'new MinKey()', 'new MaxKey()', 'new MinKey()', 'new MaxKey()',

      'new java.util.Date(819167040000)', 'new java.util.Date(819167040000)',

      // 'Pattern.compile("/[-a-zA-Z0-9@:%_\\+.~#?&//=]{2,256}\\.[a-z]{2,4}\\b(\\/[-a-zA-Z0-9@:%_\\+.~#?&//=]*)?/gi", "gi")',
      // 'Pattern.compile("/[-a-zA-Z0-9@:%_\\+.~#?&//=]{2,256}\\.[a-z]{2,4}\\b(\\/[-a-zA-Z0-9@:%_\\+.~#?&//=]*)?/gi", "gi")',
      // 'Pattern.compile("/[-a-zA-Z0-9@:%_\\+.~#?&//=]{2,256}\\.[a-z]{2,4}\\b(\\/[-a-zA-Z0-9@:%_\\+.~#?&//=]*)?/gi", "gi")',

      'new Symbol("test")', 'new Symbol("test")'

    ];
    js.map((v, i) => {
      it(v, () => {
        expect(generate(v)).to.equal(java[i]);
      });
    });
  });
});
