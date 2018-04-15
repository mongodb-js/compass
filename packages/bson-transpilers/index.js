const antlr4 = require('antlr4');
const ECMAScriptLexer = require('./lib/ECMAScriptLexer.js');
const ECMAScriptParser = require('./lib/ECMAScriptParser.js');

const Python3Generator = require('./codegeneration/Python3Generator.js');
const CSharpGenerator = require('./codegeneration/CSharpGenerator.js');
const JavaGenerator = require('./codegeneration/JavaGenerator.js');

const ErrorListener = require('./codegeneration/ErrorListener.js');

const { loadSymbolTable } = require('./codegeneration/SymbolTable');

/**
 * Compiles an ECMAScript string into another language.
 *
 * @param {String} input - Code to compile
 * @param {CodeGenerator} generator - Target language generator
 * @param {Object} symbols - Symbol table
 * @returns {String}
 */
const compileECMAScript = (input, generator, symbols) => {
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

  generator.SYMBOL_TYPE = symbols[0];
  generator.BsonTypes = symbols[1];
  generator.Symbols = symbols[2];
  generator.Types = symbols[3];
  return generator.start(tree);
};

const toJava = () => {
  const gen = new JavaGenerator();
  const symbols = loadSymbolTable('ecmascript', 'java');
  return (input) => {
    return compileECMAScript(input, gen, symbols);
  };
};

const toCSharp = () => {
  const gen = new CSharpGenerator();
  const symbols = []; // loadSymbolTable('ecmascript', 'csharp');
  return (input) => {
    return compileECMAScript(input, gen, symbols);
  };
};

const toPython = () => {
  const gen = new Python3Generator();
  const symbols = []; // loadSymbolTable('ecmascript', 'python');
  return (input) => {
    return compileECMAScript(input, gen, symbols);
  };
};

module.exports = {
  toJava: toJava(), toCSharp: toCSharp(), toPython: toPython()
};
