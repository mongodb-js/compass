const ECMAScriptVisitor = require('../lib/ECMAScriptVisitor').ECMAScriptVisitor;

/**
 * This is a Visitor superclass where helper methods used by all language
 * generators can be defined.
 *
 * @returns {object}
 */
function Visitor() {
  ECMAScriptVisitor.call(this);
  return this;
}
Visitor.prototype = Object.create(ECMAScriptVisitor.prototype);
Visitor.prototype.constructor = Visitor;

Visitor.prototype.types = Object.freeze({
  STRING: 0, REGEX: 1,
  BOOL: 10,
  INTEGER: 20, DECIMAL: 21, HEXADECIMAL: 22, OCTAL: 23,
  OBJECT: 30, ARRAY: 31,
  NULL: 40, UNDEFINED: 41,
  VARIABLE: 50 // TODO? FCALL, FDEF, VARDEF
});
Visitor.prototype.isNumericType = function(ctx) {
  return ctx.type >= 20 && ctx.type <=29;
};

/**
 * Selectively visits children of a node.
 *
 * @param ctx
 * @param {Object} options:
 *    start - child index to start iterating at.
 *    end - child index to end iterating after.
 *    step - how many children to increment each step, 1 visits all children.
 *    separator - a string separator to go between children.
 *    ignore - an array of child indexes to skip.
 * @returns {string}
 */
Visitor.prototype.visitChildren = function(ctx, options) {
  const opts = {
    start: 0, end: ctx.getChildCount() - 1, step: 1, separator: '', ignore: []
  };
  Object.assign(opts, options? options : {});
  let code = '';
  for (let i = opts.start; i <= opts.end; i+=opts.step) {
    if (opts.ignore.indexOf(i) === -1) {
      code += this.visit(ctx.getChild(i)) + (i === opts.end ? '' : opts.separator);
    }
  }
  /* Set the node's type to the first child, if it's not already set.
     More often than not, type will be set directly by the visitNode method. */
  if (ctx.type !== undefined) {
    ctx.type = ctx.children.length ? ctx.getChild(0).type : this.types.UNDEFINED;
  }
  return code.trim();
};

Visitor.prototype.visitNullLiteral = function(ctx) {
  ctx.type = this.types.NULL;
  return this.visitChildren(ctx);
};

Visitor.prototype.visitBooleanLiteral = function(ctx) {
  ctx.type = this.types.BOOL;
  return this.visitChildren(ctx);
};

Visitor.prototype.visitIntegerLiteral = function(ctx) {
  ctx.type = this.types.INTEGER;
  return this.visitChildren(ctx);
};

Visitor.prototype.visitDecimalLiteral = function(ctx) {
  ctx.type = this.types.DECIMAL;
  return this.visitChildren(ctx);
};

Visitor.prototype.visitHexIntegerLiteral = function(ctx) {
  ctx.type = this.types.HEXADECIMAL;
  return this.visitChildren(ctx);
};

Visitor.prototype.visitOctalIntegerLiteral = function(ctx) {
  ctx.type = this.types.OCTAL;
  return this.visitChildren(ctx);
};

Visitor.prototype.visitRegularExpressionLiteral = function(ctx) {
  ctx.type = this.types.REGEX;
  return this.visitChildren(ctx);
};

/**
 * Visit a leaf node and return a string.
 * *
 * @param {object} ctx
 * @returns {string}
 */
Visitor.prototype.visitTerminal = function(ctx) {
  // TODO: set type here, or always set by the visitXLiteral methods?
  return ctx.getText();
};

/////////////
// Helpers //
/////////////
/**
 * Takes in an identifier that may or may not be a string and returns a string
 * with double quotes.
 * @param {String} str
 * @returns {String}
 */
Visitor.prototype.doubleQuoteStringify = function(str) {
  let newStr = str;
  if(str.charAt(0) === '\'' && str.charAt(str.length - 1) === '\'') {
    newStr = '"' + str.substr(1, str.length - 2) + '"';
  } else if (str.charAt(0) !== '"' && str.charAt(str.length - 1) !== '"') {
    newStr = '"' + str + '"';
  }
  return newStr;
};

/**
 * Takes in an identifier that may or may not be a string and returns a string
 * with single quotes.
 * @param {String} str
 * @returns {String}
 */
Visitor.prototype.singleQuoteStringify = function(str) {
  let newStr = str;
  if(str.charAt(0) === '"' && str.charAt(str.length - 1) === '"') {
    newStr = '\'' + str.substr(1, str.length - 2) + '\'';
  } else if (str.charAt(0) !== '\'' && str.charAt(str.length - 1) !== '\'') {
    newStr = '\'' + str + '\'';
  }
  return newStr;
};

module.exports = Visitor;
