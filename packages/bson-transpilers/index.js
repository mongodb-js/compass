const path = require('path');
const antlr4 = require('antlr4');
const ECMAScriptLexer = require('./lib/ECMAScriptLexer.js');
const ECMAScriptParser = require('./lib/ECMAScriptParser.js');

const Python3Generator = require('./codegeneration/python/Generator.js');
const CSharpGenerator = require('./codegeneration/csharp/Generator.js');
const JavaGenerator = require('./codegeneration/java/Generator.js');

const ErrorListener = require('./codegeneration/ErrorListener.js');

const { loadSymbolTable } = require('./codegeneration/SymbolTable');

/**
 * Compiles an ECMAScript string into another language.
 *
 * @param {String} input - Code to compile
 * @param {CodeGenerator} generator - Target language generator
 * @returns {String}
 */
const compileECMAScript = (input, generator) => {
  const chars = new antlr4.InputStream(input);
  const lexer = new ECMAScriptLexer.ECMAScriptLexer(chars);
  lexer.strictMode = false;

  const tokens = new antlr4.CommonTokenStream(lexer);
  const parser = new ECMAScriptParser.ECMAScriptParser(tokens);
  parser.buildParseTrees = true;

  const listener = new ErrorListener();
  parser.removeErrorListeners(); // Remove the default ConsoleErrorListener
  parser.addErrorListener(listener); // Add back a custom error listener

  const tree = parser.expressionSequence();

  return generator.start(tree);
};

const toJava = () => {
  const gen = new JavaGenerator();
  const symbols = loadSymbolTable('javascript', 'java');
  Object.assign(gen, symbols);
  return (input) => {
    return compileECMAScript(input, gen);
  };
};

const toCSharp = () => {
  const gen = new CSharpGenerator();
  const symbols = {}; // loadSymbolTable('javascript', 'csharp');
  Object.assign(gen, symbols);
  return (input) => {
    return compileECMAScript(input, gen);
  };
};

const toPython = () => {
  const gen = new Python3Generator();
  const symbols = {}; // loadSymbolTable('javascript', 'python');
  Object.assign(gen, symbols);
  return (input) => {
    return compileECMAScript(input, gen);
  };
};

module.exports = {
  toJava: toJava(), toCSharp: toCSharp(), toPython: toPython()
};
