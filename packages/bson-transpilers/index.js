const path = require('path');
const fs = require('fs');
const antlr4 = require('antlr4');
const ECMAScriptLexer = require('./lib/ECMAScriptLexer.js');
const ECMAScriptParser = require('./lib/ECMAScriptParser.js');

const ErrorListener = require('./codegeneration/ErrorListener.js');

const { loadSymbolTable } = require('./codegeneration/SymbolTable');

const loadGenerator = (inputLang, outputLang) => {
  const superFile = path.join(__dirname, 'codegeneration', inputLang, 'Visitor');
  if (!fs.existsSync(superFile + '.js')) {
    throw new Error(`${inputLang} not yet implemented as input language`);
  }
  const visitor = require(superFile);

  const subFile = path.join(__dirname, 'codegeneration', outputLang, 'Generator');
  if (!fs.existsSync(subFile + '.js')) {
    throw new Error(`${outputLang} not yet implemented as target language`);
  }
  const getG = require(subFile);
  const Generator = getG(visitor);

  return new Generator();
};

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

const compile = (input, generator) => {
  const tree = loadTree(input);
  return generator.start(tree);
};

const getCompiler = (inputLang, outputLang) => {
  const generator = loadGenerator(inputLang, outputLang);
  const symbols = loadSymbolTable(inputLang, outputLang);

  Object.assign(generator, symbols);
  return generator;
};

const toJava = () => {
  return (input) => {
    return compile(input, getCompiler('javascript', 'java'));
  };
};

const toCSharp = () => {
  return (input) => {
    return compile(input, getCompiler('javascript', 'csharp'));
  };
};

const toPython = () => {
  return (input) => {
    return compile(input, getCompiler('javascript', 'python'));
  };
};


module.exports = {
  toJava: toJava(), toCSharp: toCSharp(), toPython: toPython()
};
