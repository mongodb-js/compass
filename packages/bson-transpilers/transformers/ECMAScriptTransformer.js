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
  return {
    type: 'visitProgram',
    children: this.visitChildren(ctx).filter((item) => (item !== undefined))
  };
};

Translator.prototype.visitAdditiveExpression = function(ctx) {
  return {
    type: 'visitAdditiveExpression',
    children: this.visitChildren(ctx).filter((item) => (item !== undefined))
  };
};

Translator.prototype.visitLiteral = function(ctx) {
  return ctx.getText();
};

Translator.prototype.visitSourceElements = function(ctx) {
  return this.visitChildren(ctx)[0];
};

Translator.prototype.visitSourceElement = function(ctx) {
  return this.visitChildren(ctx)[0];
};

Translator.prototype.visitStatement = function(ctx) {
  return this.visitChildren(ctx)[0];
};

Translator.prototype.visitExpressionStatement = function(ctx) {
  return this.visitChildren(ctx)[0];
};

Translator.prototype.visitExpressionSequence = function(ctx) {
  return this.visitChildren(ctx)[0];
};

Translator.prototype.visitLiteralExpression = function(ctx) {
  return this.visitChildren(ctx)[0];
};

module.exports = Translator;
