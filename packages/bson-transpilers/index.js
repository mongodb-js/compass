const antlr4 = require('antlr4');
const ECMAScriptLexer = require('./lib/ECMAScriptLexer.js');
const ECMAScriptParser = require('./lib/ECMAScriptParser.js');
const ECMAScriptListener = require('./lib/ECMAScriptListener.js');
const ECMAScriptTransformer = require('./transformers/ECMAScriptTransformer.js');
const ECMAScriptVisitor = require('./codegeneration/ECMAScriptVisitor.js');

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
  const tree = parser.program();

  // Generate AST
  const transformer = new ECMAScriptTransformer();
  transformer.visit(tree);
  

  // Generate code
  // const visitor = new ECMAScriptVisitor();
  // return visitor.visitProgram(tree);
  function CustomListener() {
    ECMAScriptListener.ECMAScriptListener.call(this);
  };
  
  CustomListener.prototype = ECMAScriptListener.ECMAScriptListener.prototype
  CustomListener.prototype.constructor = CustomListener
  
  CustomListener.prototype.enterEveryRule = (ctx) => {
    console.log(`enter ${parser.ruleNames[ctx.ruleIndex]}: ${ctx.getText()}`);
  };
  
  const listener = new CustomListener();
  
  antlr4.tree.ParseTreeWalker.DEFAULT.walk(listener, tree);
  
};

const input = '999 + 888';

compileECMAScript(input);


