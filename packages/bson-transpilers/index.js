const antlr4 = require('antlr4');
const ECMAScriptLexer = require('./lib/ECMAScriptLexer.js');
const ECMAScriptParser = require('./lib/ECMAScriptParser.js');

const Python3Generator = require('./codegeneration/Python3Generator.js');
const JavaGenerator = require('./codegeneration/JavaGenerator.js');

/**
 * Compiles an ECMAScript string into another language.
 *
 * @param {String} input
 * @param {CodeGenerator} generator
 * @returns {String}
 */
const compileECMAScript = function(input, generator) {
  const chars = new antlr4.InputStream(input);
  const lexer = new ECMAScriptLexer.ECMAScriptLexer(chars);
  lexer.strictMode = false;
  const tokens = new antlr4.CommonTokenStream(lexer);
  const parser = new ECMAScriptParser.ECMAScriptParser(tokens);
  parser.buildParseTrees = true;
  const tree = parser.expressionSequence();
  return generator.start(tree);
};

module.exports = {
  toJava: (input) => { return compileECMAScript(input, new JavaGenerator()); },
  toPython: (input) => { return compileECMAScript(input, new Python3Generator()); }
};
