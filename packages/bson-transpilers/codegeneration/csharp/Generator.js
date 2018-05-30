/* eslint complexity: 0 */
const { doubleQuoteStringify } = require('../../helper/format');

module.exports = (superclass) => class ExtendedVisitor extends superclass {
  constructor() {
    super();
    this.new = 'new ';
    this.regexFlags = {
      i: 'i',  // ignore case
      m: 'm',  // multiline
      u: '', // unicode
      y: '',   // sticky search
      g: ''    // global
    };
    this.bsonRegexFlags = {
      'i': 'i', // Case insensitivity to match
      'm': 'm', // Multiline match
      'x': 'x', // Ignore all white space characters
      's': 's', // Matches all
      'l': '', // Case-insensitive matching dependent on the current locale?
      'u': '' // Unicode?
    };
  }

  /**
   * @param {NewExpressionContextObject} ctx
   *
   * @returns {string} - visited expression
   */
  emitNew(ctx) {
    const expr = this.visit(ctx.singleExpression());
    ctx.type = ctx.singleExpression().type;

    return expr;
  }

  /**
   * Symbol is just used a string in c#
   *
   * @param {FuncCallExpressionContext} ctx
   *
   * @returns {string} - value
   */
  emitSymbol(ctx) {
    ctx.type = this.Types.Symbol;
    const args = ctx.arguments().argumentList().singleExpression();
    const expr = args[0].getText();

    return doubleQuoteStringify(expr.toString());
  }

  /**
   * Long should just be the number + letter 'L'
   *
   * @param {FuncCallExpressionContext} ctx
   * @param {str} str - processed str from the visitor
   *
   * @returns {string} - valueL
   */
  emitLong(ctx, str) {
    return `${str}L`;
  }

  /**
   * We don't need `new` since we are always using a .Parse
   *
   * @param {FuncCallExpressionContext} ctx
   * @param {String} decimal
   *
   * @returns {string} - Decimal128.Parse(val)
   */
  emitDecimal128(ctx, decimal) {
    return `Decimal128.Parse(${doubleQuoteStringify(decimal)})`;
  }

  /**
   * BSON MinKey Constructor
   * needs to be in emit, since does not need a 'new' keyword
   *
   * @param {FuncCallExpressionContext} ctx
   *
   * @returns {string} - BsonMinKey.Value
   */
  emitMinKey(ctx) {
    ctx.type = this.Types.MinKey;
    return 'BsonMinKey.Value';
  }

  /**
   * BSON MaxKey Constructor
   * needs to be in emit, since does not need a 'new' keyword
   *
   * @param {FuncCallExpressionContext} ctx
   *
   * @returns {string} - BsonMaxKey.Value
   */
  emitMaxKey(ctx) {
    ctx.type = this.Types.MaxKey;
    return 'BsonMaxKey.Value';
  }

  /**
   * Special cased because different target languages need different info out
   * of the constructed date.
   *
   * child nodes: arguments
   * grandchild nodes: argumentList?
   * great-grandchild nodes: singleExpression+
   *
   * @param {FuncCallExpressionContext} ctx
   * @param {Date} date
   * @return {String}
   */
  emitDate(ctx, date) {
    let toStr = '';
    ctx.type = this.Types.Date;

    // we need to return a string if just the Date() gets called
    if (!ctx.wasNew && this.visit(ctx.singleExpression()) !== 'ISODate') {
      ctx.type = this.Types._string;
      toStr = '.ToString()';
    }

    // it's just the now time if there are no args
    if (date === undefined) {
      return `DateTime.Now${toStr}`;
    }

    const dateStr = [
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds()
    ].join(', ');

    return `new DateTime(${dateStr})${toStr}`;
  }

  /**
   * Date Now. This doesn't need a keyword 'new', nor is 'Now' a callable
   * function, so we need to adjust this.
   *
   * @param {FuncCallExpressionContext} ctx
   *
   * @returns {string} - DateTime.Now
   */

  emitnow(ctx) {
    ctx.type = this.Types.Now;
    return 'DateTime.Now';
  }
};
