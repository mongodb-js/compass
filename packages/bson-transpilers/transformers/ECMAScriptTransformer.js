const ECMAScriptVisitor = require('../lib/ECMAScriptVisitor.js').ECMAScriptVisitor;

/**
 * This "Transformer" is a visitor that walks the parse tree generated from raw
 * input and returns an AST.
 */
function Translator() {
  ECMAScriptVisitor.call(this);
  return this;
}

Translator.prototype = Object.create(ECMAScriptVisitor.prototype);
Translator.prototype.constructor = Translator;

Translator.prototype.visitProgram = function(ctx) {
  return this.visitChildren(ctx);
};

Translator.prototype.skipNode = function(ctx) {
  const parent = ctx.parentCtx;
  const index = parent.children.indexOf(ctx);
  parent.children.splice(index, 1);

  const numChildren = ctx.getChildCount();
  for(let i = 0; i < numChildren; i++) {
    const child = ctx.getChild(i);
    child.parentCtx = parent;
    parent.addChild(child);
  }
  return this.visitChildren(ctx);
};

Translator.prototype.deleteNode = function(ctx) {
  const parent = ctx.parentCtx;
  const index = parent.children.indexOf(ctx);
  parent.children.splice(index, 1);
}

Translator.prototype.visitExpressionStatement = function(ctx) {
  return this.skipNode(ctx);
};

// Translator.prototype.visitExpressionSequence = function(ctx) {
//   return this.skipNode(ctx);
// };

Translator.prototype.visitNumericLiteral = function(ctx) {
  return this.skipNode(ctx);
};

Translator.prototype.visitLiteralExpression = function(ctx) {
  return this.skipNode(ctx);
};

Translator.prototype.visitEmptyStatement = function(ctx) {
  this.deleteNode(ctx);
};

Translator.prototype.visitArrayLiteralExpression = function(ctx) {
  return this.skipNode(ctx);
};

Translator.prototype.visitArrayLiteral = function(ctx) {
  // remove [ ]
  ctx.children.splice(0, 1);
  ctx.removeLastChild();
  return this.visitChildren(ctx);
};

Translator.prototype.visitObjectLiteralExpression = function(ctx) {
  return this.skipNode(ctx);
};

Translator.prototype.visitElementList = function(ctx) {
  return this.skipNode(ctx);
};


// TODO: Objects are parsed as "Block" instead of as ObjectLiteral

module.exports = Translator;
