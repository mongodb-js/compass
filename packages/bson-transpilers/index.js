const antlr4 = require('antlr4');
const ECMAScriptLexer = require('./lib/ECMAScriptLexer.js');
const ECMAScriptParser = require('./lib/ECMAScriptParser.js');
const ECMAScriptVisitor = require('./codegeneration/ECMAScriptVisitor');

const JavaLexer = require('./lib/JavaLexer.js');
const JavaParser = require('./lib/JavaParser.js');

const CSharpLexer = require('./lib/CSharpLexer.js');
const CSharpParser = require('./lib/CSharpParser.js');

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

  // Generate Code
  const visitor = new ECMAScriptVisitor();
  console.log(visitor.visitExpression(tree));
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
  const visitor = new ECMAScriptVisitor();
  console.log(visitor.visitExpression(tree));
};

const input = '1 + 2';

compileECMAScript(input);
compileJava(input);
compileCSharp(input);
