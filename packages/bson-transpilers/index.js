const path = require('path');
const fs = require('fs');
const antlr4 = require('antlr4');
const ECMAScriptLexer = require('./lib/ECMAScriptLexer.js');
const ECMAScriptParser = require('./lib/ECMAScriptParser.js');

const ErrorListener = require('./codegeneration/ErrorListener.js');

const { loadSymbolTable } = require('./codegeneration/SymbolTable');

/**
 * Imports the visitor, per input language.
 * Imports the generater, per output language.
 *
 * The generator inherits from the visitor.
 *
 * @param {String} inputLang
 * @param {String} outputLang
 * @return {antlr4.tree.ParseTreeVisitor} - The compiler, without symbols.
 */
const getCompiler = (inputLang, outputLang) => {
  const superFile = path.join(__dirname, 'codegeneration', inputLang, 'Visitor');
  if (!fs.existsSync(superFile + '.js')) {
    throw new Error(`${inputLang} not yet implemented as input language`);
  }
  const visitor = require(superFile);

  const subFile = path.join(__dirname, 'codegeneration', outputLang, 'Generator');
  if (!fs.existsSync(subFile + '.js')) {
    throw new Error(`${outputLang} not yet implemented as target language`);
  }
  const Generator = require(subFile)(visitor);

  return new Generator();
};

/**
 * Constructs the parse tree from the code given by the user.
 *
 * TODO: hardcoded to ECMAScriptLexer/Parser
 * @param {String} input
 * @return {antlr4.ParserRuleContext} - The parse tree.
 */
const loadTree = (input) => {
  // TODO: swap out lexer/parser/etc depending on input lang
  const chars = new antlr4.InputStream(input);
  const lexer = new ECMAScriptLexer.ECMAScriptLexer(chars);
  lexer.strictMode = false;

  const tokens = new antlr4.CommonTokenStream(lexer);
  const parser = new ECMAScriptParser.ECMAScriptParser(tokens);
  parser.buildParseTrees = true;

  const listener = new ErrorListener();
  parser.removeErrorListeners(); // Remove the default ConsoleErrorListener
  parser.addErrorListener(listener); // Add back a custom error listener

  return parser.expressionSequence();
};

/**
 * Puts everything together: Visitor, Generator, and Symbol table.
 *
 * @param {String} inputLang
 * @param {String} outputLang
 * @return {antlr4.tree.ParseTreeVisitor} - the compiler with a symbol table.
 */
const getCompilerWithSymbols = (inputLang, outputLang) => {
  const generator = getCompiler(inputLang, outputLang);
  const symbols = loadSymbolTable(inputLang, outputLang);

  Object.assign(generator, symbols);
  return generator;
};

/**
 * Generates a compiler for the input/export language, and returns a function
 * that will compile input into the target language.
 *
 * @param {String} inputLang
 * @param {String} outputLang
 * @return {function(*=)}
 */
const make = (inputLang, outputLang) => {
  const compiler = getCompilerWithSymbols(inputLang, outputLang);
  return (input) => {
    const tree = loadTree(input);
    return compiler.start(tree);
  };
};

module.exports = {
  javascript: {
    java: make('javascript', 'java')
    // python: make('javascript', 'python'),
    // csharp: make('javascript', 'csharp'),
    // shell: make('javascript', 'shell')
  },
  shell: {
    java: make('shell', 'java')
    // python: make('shell', 'python'),
    // csharp: make('shell', 'csharp'),
    // javascript: make('shell', 'javascript')
  }
};
