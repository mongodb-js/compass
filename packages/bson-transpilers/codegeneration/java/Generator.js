/* eslint complexity: 0 */
const {doubleQuoteStringify} = require('../../helper/format');

/**
 * @param {class} superClass - where the `visitX` methods live.
 * @returns {Generator}
 */
module.exports = (superClass) => class ExtendedVisitor extends superClass {
  constructor() {
    super();
    this.new = 'new ';
    this.regexFlags = {
      i: 'i', m: 'm', u: 'u', y: '', g: ''
    };
  }

  /**
   * Ignore the new keyword because JS could either have it or not, but we always
   * need it in Java so we'll add it when we call constructors.
   * TODO: do we ever need the second arguments expr?
   *
   * Child nodes: singleExpression arguments?
   *
   * @param {NewExpressionContext} ctx
   * @return {String}
   */
  emitNew(ctx) {
    const expr = this.visit(ctx.singleExpression());
    ctx.type = ctx.singleExpression().type;
    return expr;
  }

  /**
   * Special cased because different target languages need different info out
   * of the constructed date.
   *
   * child nodes: arguments
   * grandchild nodes: argumentList?
   * great-grandchild nodes: singleExpression+
   * @param {FuncCallExpressionContext} ctx
   * @param {Date} date
   * @return {String}
   */
  emitDate(ctx, date) {
    let toStr = '';
    if (!ctx.wasNew && this.visit(ctx.singleExpression()) !== 'ISODate') {
      ctx.type = this.Types._string;
      toStr = '.toString()';
    }
    if (date === undefined) {
      return `new java.util.Date()${toStr}`;
    }
    return `new java.util.Date(new java.lang.Long("${date.getTime()}"))${toStr}`;
  }
  emitISODate(ctx) {
    return this.emitDate(ctx);
  }

  /**
   * Expects two strings as arguments, the second must contain any of "imxlsu"
   *
   * child nodes: arguments
   * grandchild nodes: argumentList?
   * great-grandchild nodes: singleExpression+
   * @param {FuncCallExpressionContext} ctx
   * @return {String}
   */
  emitBSONRegExp(ctx) {
    ctx.type = this.Types.BSONRegExpType;
    const argList = ctx.arguments().argumentList();
    const args = this.checkArguments([[this.Types._string], [this.Types._string, null]], argList);

    if (args.length === 2) {
      const flags = args[1];
      for (let i = 1; i < flags.length - 1; i++) {
        if (
          !(
            flags[i] === 'i' ||
            flags[i] === 'm' ||
            flags[i] === 'x' ||
            flags[i] === 'l' ||
            flags[i] === 's' ||
            flags[i] === 'u'
          )
        ) {
          return `Error: the regular expression options [${flags[i]}] is not supported`;
        }
      }
      return `new BsonRegularExpression(${args[0]}, ${flags})`;
    }
    return `new BsonRegularExpression(${args[0]})`;
  }

  /**
   * Special cased because don't want 'new' here.
   *
   * @param {FuncCallExpressionContext} ctx
   * @param {String} str - the number as a string.
   * @return {String}
   */
  emitDecimal128(ctx, str) {
    return `Decimal128.parse(${doubleQuoteStringify(str)})`;
  }
  emitNumberDecimal(ctx, str) {
    return `Decimal128.parse(${doubleQuoteStringify(str)})`;
  }

  /*  ************** Object methods **************** */

  /*
   * Accepts date or number, if date then don't convert to date.
   * @param ctx
   */
  emitObjectIdCreateFromTime(ctx) {
    ctx.type = 'createFromTime' in this.Symbols.ObjectId.attr ? this.Symbols.ObjectId.attr.createFromTime : this.Symbols.ObjectId.attr.fromDate;
    const argList = ctx.arguments().argumentList();
    const args = this.checkArguments(ctx.type.args, argList);
    if (argList.singleExpression()[0].type.id === 'Date') {
      return ctx.type.argsTemplate('', args[0]);
    }
    return ctx.type.argsTemplate('', `new java.util.Date(${args[0]})`);
  }

};
