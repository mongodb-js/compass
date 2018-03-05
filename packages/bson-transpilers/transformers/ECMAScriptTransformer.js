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
  console.log('start translator');
  return this.visitChildren(ctx);
};

module.exports = Translator;