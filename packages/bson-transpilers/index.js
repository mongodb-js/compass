const antlr4 = require('antlr4');
const ECMAScriptLexer = require('./lib/ECMAScriptLexer.js');
const ECMAScriptParser = require('./lib/ECMAScriptParser.js');
const ECMAScriptPrinter = require('./printers/ECMAScriptListener.js');
const ECMAScriptGenerator = require('./codegeneration/ECMAScriptGenerator.js');

const JavaLexer = require('./lib/JavaLexer.js');
const JavaParser = require('./lib/JavaParser.js');

const CSharpLexer = require('./lib/CSharpLexer.js');
const CSharpParser = require('./lib/CSharpParser.js');

const Python3Lexer = require('./lib/Python3Lexer.js');
const Python3Parser = require('./lib/Python3Parser.js');

/**
 * Compiles an ECMAScript string into... an ECMAScript string.
 *
 * @param {String} input
 * @returns {String}
 */
const compileECMAScript = function(input) {
  // Create parse tree
  const chars = new antlr4.InputStream(input);
  const lexer = new ECMAScriptLexer.ECMAScriptLexer(chars);
  const tokens = new antlr4.CommonTokenStream(lexer);
  const parser = new ECMAScriptParser.ECMAScriptParser(tokens);
  parser.buildParseTrees = true;
  const tree = parser.expressionSequence();

  // Print
  const listener = new ECMAScriptPrinter();
  const AST = listener.buildAST(tree, parser.ruleNames);
  console.log('ECMAScript AST----------------------');
  console.log(JSON.stringify(AST, null, 2));
  console.log('----------------------');

  // Generate Code
  const visitor = new ECMAScriptGenerator();
  console.log(visitor.visit(tree));
};

const compileJava = function(input) {
  // Create parse tree
  const chars = new antlr4.InputStream(input);
  const lexer = new JavaLexer.JavaLexer(chars);
  const tokens = new antlr4.CommonTokenStream(lexer);
  const parser = new JavaParser.JavaParser(tokens);
  parser.buildParseTrees = true;
  const tree = parser.expression();

  // Generate Code
  const visitor = new ECMAScriptGenerator();
  console.log(visitor.visit(tree));
};

const compileCSharp = function(input) {
  // Create parse tree
  const chars = new antlr4.InputStream(input);
  const lexer = new CSharpLexer.CSharpLexer(chars);
  const tokens = new antlr4.CommonTokenStream(lexer);
  const parser = new CSharpParser.CSharpParser(tokens);
  parser.buildParseTrees = true;
  const tree = parser.expression();

  // Generate Сode
  const visitor = new ECMAScriptGenerator();
  console.log(visitor.visit(tree));
};

const compilePython = function(input) {
  // Create parse tree
  const chars = new antlr4.InputStream(input);
  const lexer = new Python3Lexer.Python3Lexer(chars);
  const tokens = new antlr4.CommonTokenStream(lexer);
  const parser = new Python3Parser.Python3Parser(tokens);

  parser.buildParseTrees = true;
  const tree = parser.single_input();

  // Generate Сode
  const visitor = new ECMAScriptGenerator();
  console.log(visitor.visit(tree));
};

const input = '{x: 1}\n';

compileECMAScript(input);
