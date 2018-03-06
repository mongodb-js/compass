const ECMAScriptVisitor = require('../lib/ECMAScriptVisitor.js').ECMAScriptVisitor;

/**
 * This "Transformer" is a visitor that walks the parse tree generated from raw
 * input and returns an AST.
 */
function Translator () {
  ECMAScriptVisitor.call(this);
  return this;
}

Translator.prototype = Object.create(ECMAScriptVisitor.prototype);
Translator.prototype.constructor = Translator;

Translator.prototype.visitProgram = function(ctx) {
  console.log('visitProgram');

  return this.visitChildren(ctx);
};

Translator.prototype.skipNode = function(ctx) {
  const child = ctx.getChild(0);
  const parent = ctx.parentCtx;
  parent.removeLastChild();
  child.parentCtx = parent;
  parent.addChild(child);
  return this.visit(child);
};

Translator.prototype.visitSourceElement = function(ctx) {
  return this.skipNode(ctx);
};

Translator.prototype.visitStatement = function(ctx) {
  return this.skipNode(ctx);
};

Translator.prototype.visitExpressionStatement = function(ctx) {
  return this.skipNode(ctx);
};

Translator.prototype.visitExpressionSequence = function(ctx) {
  return this.skipNode(ctx);
};

Translator.prototype.visitExpression = function(ctx) {
  return this.skipNode(ctx);
};

Translator.prototype.visitLiteral = function(ctx) {
  return this.skipNode(ctx);
};


module.exports = Translator;