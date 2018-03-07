const antlr4 = require('antlr4');
const ECMAScriptLexer = require('./lib/ECMAScriptLexer.js');
const ECMAScriptParser = require('./lib/ECMAScriptParser.js');
const ECMAScriptPrinter = require('./printers/ECMAScriptListener.js');
const ECMAScriptVisitor = require('./codegeneration/ECMAScriptVisitor');

const JavaLexer = require('./lib/JavaLexer.js');
const JavaParser = require('./lib/JavaParser.js');
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

  const listener = new ECMAScriptPrinter();
  const AST = listener.buildAST(tree, parser.ruleNames);
  console.log('ECMAScript AST----------------------');
  console.log(JSON.stringify(AST, null, 2));
  console.log('----------------------');

  // Generate Code
  const visitor = new ECMAScriptVisitor();
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

  const listener = new JavaPrinter();
  const AST = listener.buildAST(tree, parser.ruleNames);
  console.log('Java AST----------------------');
  console.log(JSON.stringify(AST, null, 2));
  console.log('----------------------');

  // Generate Code
  const visitor = new ECMAScriptVisitor();
  console.log(visitor.visitExpression(tree));
};

const input = '[1, 2, 3]';

compileECMAScript(input);
compileJava(input);


