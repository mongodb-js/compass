/* eslint no-unused-vars: 0*/
const antlr4 = require('antlr4');
const ECMAScriptLexer = require('./lib/ECMAScriptLexer.js');
const ECMAScriptParser = require('./lib/ECMAScriptParser.js');

const Python3Generator = require('./codegeneration/Python3Generator.js');
const JavaGenerator = require('./codegeneration/JavaGenerator.js');

/**
 * Compiles an ECMAScript string into another language.
 *
 * @param {String} input
 * @param {antlr4.tree.ParseTreeVisitor} generator
 */
const compileECMAScript = function(input, generator) {
  // Create parse tree
  const chars = new antlr4.InputStream(input);
  const lexer = new ECMAScriptLexer.ECMAScriptLexer(chars);
  const tokens = new antlr4.CommonTokenStream(lexer);
  const parser = new ECMAScriptParser.ECMAScriptParser(tokens);
  parser.buildParseTrees = true;
  const tree = parser.expressionSequence();

  // Print
  // const listener = new ECMAScriptPrinter();
  // const AST = listener.buildAST(tree, parser.ruleNames);
  // console.log('ECMAScript AST----------------------');
  // console.log(JSON.stringify(AST, null, 2));
  // console.log('----------------------');

  // Generate Code
  return generator.visitExpressionSequence(tree);
};

const input = '[1, 2]';
console.log(compileECMAScript(input, new JavaGenerator()));

module.exports = compileECMAScript;
