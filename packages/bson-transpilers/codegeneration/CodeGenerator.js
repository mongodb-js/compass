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
  return code.trim();
};

/**
 * Visit a leaf node and return a string.
 * *
 * @param {object} ctx
 * @returns {string}
 */
Visitor.prototype.visitTerminal = function(ctx) {
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
