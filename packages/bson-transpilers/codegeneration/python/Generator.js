
/* eslint complexity: 0 */
// cannot use path.resolve as it will not work with webpack in the browser
const {
  singleQuoteStringify,
  removeQuotes
} = require('../../helper/format');
const {
  SemanticArgumentCountMismatchError,
  SemanticGenericError,
  SemanticTypeError
} = require('../../helper/error');

/**
 * Handling emit methods binded with visitor.
 *
 * @param {class} superClass
 * @returns {object}
 */
module.exports = (superClass) => class ExtendedVisitor extends superClass {
  constructor() {
    super();
    this.regexFlags = {
      i: 'i', // re.IGNORECASE
      m: 'm', // re.MULTILINE
      u: 'a', // re.ASCII
      y: '', // Sticky flag matches only from the index indicated by the lastIndex property
      g: 's' // re.DOTALL matches all
      // re.DEBUG - Display debug information. No corresponding inline flag.
      // re.LOCALE - Case-insensitive matching dependent on the current locale. Inline flag (?L)
      // re.VERBOSE - More readable way of writing patterns (eg. with comments)
    };
    this.regexBSONFlags = {
      'i': 'i', // Case insensitivity to match
      'm': 'm', // Multiline match
      'x': 'x', // Ignore all white space characters
      's': 's', // Matches all
      'l': 'l', // Case-insensitive matching dependent on the current locale?
      'u': 'u' // Unicode?
    };
  }

  /**
   * Because Python doesn't need `New`, we can skip the first child.
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
   *
   * @param {FuncCallExpressionContext} ctx
   * @param {Date} date
   * @return {String}
   */
  emitDate(ctx, date) {
    ctx.type = this.Types.Date;
    let toStr = '';
    if (!ctx.wasNew && this.visit(ctx.singleExpression()) !== 'ISODate') {
      ctx.type = this.Types._string;
      toStr = '.strftime(\'%a %b %d %Y %H:%M:%S %Z\')';
    }

    if (date === undefined) {
      return `datetime.datetime.utcnow().date()${toStr}`;
    }
    const dateStr = [
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds()
    ].join(', ');

    return `datetime.datetime(${dateStr}, tzinfo=datetime.timezone.utc)${toStr}`;
  }

  /**
   * Expects two strings as arguments, the second must contain any of "imxlsu".
   *
   * child nodes: arguments
   * grandchild nodes: argumentList?
   * great-grandchild nodes: singleExpression+
   *
   * @param {FuncCallExpressionContext} ctx
   * @return {String}
   */
  emitBSONRegExp(ctx) {
    ctx.type = this.Types.BSONRegExp;
    const argumentList = ctx.arguments().argumentList();

    if (
      argumentList === null ||
      (argumentList.getChildCount() !== 1 && argumentList.getChildCount() !== 3)
    ) {
      throw new SemanticArgumentCountMismatchError({
        message: 'BSONRegExp requires one or two arguments'
      });
    }

    const args = argumentList.singleExpression();
    const pattern = this.visit(args[0]);

    if (args[0].type !== this.Types._string) {
      throw new SemanticTypeError({
        message: 'BSONRegExp requires pattern to be a string'
      });
    }

    if (args.length === 2) {
      let flags = this.visit(args[1]);

      if (args[1].type !== this.Types._string) {
        throw new SemanticTypeError({
          message: 'BSONRegExp requires flags to be a string'
        });
      }

      if (flags !== '') {
        const unsuppotedFlags = [];

        flags = removeQuotes(flags).split('')
          .map((item) => {
            if (Object.keys(this.regexBSONFlags).includes(item) === false) {
              unsuppotedFlags.push(item);
            }

            return this.regexBSONFlags[item];
          });

        if (unsuppotedFlags.length > 0) {
          throw new SemanticGenericError({
            message: `Regular expression contains unsuppoted '${unsuppotedFlags.join('')}' flag`
          });
        }

        flags = singleQuoteStringify(flags.join(''));
      }

      return `Regex(${pattern}, ${flags})`;
    }

    return `Regex(${pattern})`;
  }

  /**
   * TODO: Maybe move this to javascript/Visitor and use template?
   *
   * child nodes: arguments
   * grandchild nodes: argumentList?
   * great-grandchild nodes: singleExpression+
   *
   * @param {FuncCallExpressionContext} ctx
   * @return {String}
   */
  emitLong(ctx) {
    ctx.type = this.Types.Long;

    let longstr;

    try {
      longstr = this.executeJavascript(ctx.getText()).toString();
    } catch (error) {
      throw new SemanticGenericError({message: error.message});
    }

    return `Int64(${longstr})`;
  }

  /**
   * TODO: Could move this to javascript/Visitor and use template.
   *
   * @param {FuncCallExpressionContext} ctx
   * @return {String}
   */
  emitDecimal128(ctx, str) {
    return `Decimal128(${singleQuoteStringify(str)})`;
  }
  emitNumberDecimal(ctx, str) {
    return `Decimal128(${singleQuoteStringify(str)})`;
  }

  /* ************** Object methods **************** */

  /**
   * LongfromBits method
   *
   * @param {FuncCallExpressionContext} ctx
   * @return {String}
   */
  emitLongfromBits(ctx) {
    return this.emitLong(ctx);
  }

  /**
   * Decimal128toJSON method
   *
   * @param {FuncCallExpressionContext} ctx
   * @return {String}
   */
  emitDecimal128toJSON(ctx) {
    ctx.type = this.Types._object;

    return `json_util.dumps(${this.visit(ctx.singleExpression().singleExpression())})`;
  }

  /**
   * LongtoString method
   *
   * @param {FuncCallExpressionContext} ctx
   * @return {String}
   */
  emitLongtoString(ctx) {
    ctx.type = this.Types._string;

    const long = ctx.singleExpression().singleExpression();
    let longstr;

    try {
      longstr = this.executeJavascript(long.getText()).toString();
    } catch (error) {
      throw new SemanticGenericError({message: error.message});
    }

    return `str(Int64(${longstr}))`;
  }

  /**
   * DBReftoJSON method
   *
   * @param {FuncCallExpressionContext} ctx
   * @return {String}
   */
  emitDBReftoJSON(ctx) {
    ctx.type = this.Types._object;

    const argsList = ctx.singleExpression().singleExpression().arguments();
    const args = argsList.argumentList().singleExpression();
    const ns = this.visit(args[0]);
    const oid = this.visit(args[1]);
    let db = '""';

    if (args.length === 3) {
      db = this.visit(args[2]);

      return `json_util.dumps(DBRef(${ns}, ${oid}, ${db}))`;
    }

    return `json_util.dumps(DBRef(${ns}, ${oid}))`;
  }

  /**
   * CodetoJSON method
   *
   * @param {FuncCallExpressionContext} ctx
   * @return {String}
   */
  emitCodetoJSON(ctx) {
    ctx.type = this.Types._object;

    const argsList = ctx.singleExpression().singleExpression().arguments();
    const args = argsList.argumentList().singleExpression();
    const code = singleQuoteStringify(args[0].getText());
    let scope = 'undefined';

    if (args.length === 2) {
      scope = this.visit(args[1]);

      return `json_util.dumps(Code(${code}, ${scope}))`;
    }

    return `json_util.dumps(Code(${code}))`;
  }
};
