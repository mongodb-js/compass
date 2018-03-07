const antlr4 = require('antlr4');
const ECMAScriptLexer = require('./lib/ECMAScriptLexer.js');
const ECMAScriptParser = require('./lib/ECMAScriptParser.js');
const ECMAScriptTransformer = require('./transformers/ECMAScriptTransformer.js');
const ECMAScriptPrinter = require('./printers/ECMAScriptListener.js');

const JavaLexer = require('./lib/JavaLexer.js');
const JavaParser = require('./lib/JavaParser.js');
const JavaTransformer = require('./transformers/JavaTransformer.js');
const JavaPrinter = require('./printers/JavaListener.js');

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
  const transformer = new ECMAScriptTransformer();

  // Generate AST
  transformer.visitExpressionSequence(tree);

  const listener = new ECMAScriptPrinter();
  const AST = listener.buildAST(tree, parser.ruleNames);
  console.log('AST----------------------');
  console.log(JSON.stringify(AST, null, 2));
  console.log('----------------------');
};

const compileJava = function(input) {
  // Create parse tree
  const chars = new antlr4.InputStream(input);
  const lexer = new JavaLexer.JavaLexer(chars);
  const tokens = new antlr4.CommonTokenStream(lexer);
  const parser = new JavaParser.JavaParser(tokens);
  parser.buildParseTrees = true;
  const tree = parser.expression();
  const transformer = new JavaTransformer();

  // Generate AST
  transformer.visit(tree);

  // Print
  const listener = new JavaPrinter();
  const AST = listener.buildAST(tree, parser.ruleNames);
  console.log('AST----------------------');
  console.log(JSON.stringify(AST, null, 2));
  console.log('----------------------');
};

const input = '1 + 2';

compileJava(input);


