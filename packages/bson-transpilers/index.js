const antlr4 = require('antlr4');
const ECMAScriptLexer = require('./lib/ECMAScriptLexer.js');
const ECMAScriptParser = require('./lib/ECMAScriptParser.js');

const Python3Generator = require('./codegeneration/Python3Generator.js');
const CSharpGenerator = require('./codegeneration/CSharpGenerator.js');
const JavaGenerator = require('./codegeneration/JavaGenerator.js');

const ErrorListener = require('./codegeneration/ErrorListener.js');

/**
 * Compiles an ECMAScript string into another language.
 *
 * @param {String} input
 * @param {CodeGenerator} generator
 * @returns {String}
 */
const compileECMAScript = (input, generator) => {
  const chars = new antlr4.InputStream(input);
  const lexer = new ECMAScriptLexer.ECMAScriptLexer(chars);

  lexer.strictMode = false;

  const tokens = new antlr4.CommonTokenStream(lexer);
  const parser = new ECMAScriptParser.ECMAScriptParser(tokens);
  const listener = new ErrorListener();

  // Do this after creating the Parser and before running it
  parser.removeErrorListeners(); // Remove the default ConsoleErrorListener
  parser.addErrorListener(listener); // Add back a custom error listener

  parser.buildParseTrees = true;

  const tree = parser.expressionSequence();
  const output = generator.start(tree);

  return output;
};

module.exports = {
  toJava: (input) => { return compileECMAScript(input, new JavaGenerator()); },
  toCSharp: (input) => { return compileECMAScript(input, new CSharpGenerator()); },
  toPython: (input) => { return compileECMAScript(input, new Python3Generator()); }
};
