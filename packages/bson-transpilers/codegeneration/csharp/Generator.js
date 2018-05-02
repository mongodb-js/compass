/* eslint complexity: 0 */
const { doubleQuoteStringify, removeQuotes } = require('../../helper/format');
const {
  SemanticGenericError,
  SemanticTypeError
} = require('../../helper/error');

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

    this.binarySubTypes = {
      0: 'BsonBinarySubType.Binary',
      1: 'BsonBinarySubType.Function',
      2: 'BsonBinarySubType.OldBinary',
      3: 'BsonBinarySubType.UuidLegacy',
      4: 'BsonBinarySubType.UuidStandard',
      5: 'BsonBinarySubType.MD5',
      128: 'BsonBinarySubType.UserDefined'
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
   * BSON Binary Constructor
   * needs to execute JS to get value first
   *
   * @param {BSONBinaryObject} ctx
   *
   * @returns {string} - new BsonBinaryData()
   */
  emitBinaryFromJS(ctx) {
    ctx.type = this.Types.Binary;
    let type;
    let binobj;
    try {
      binobj = this.executeJavascript(ctx.getText());
      type = binobj.sub_type;
    } catch (error) {
      throw new SemanticGenericError({message: error.message});
    }
    const bytes = doubleQuoteStringify(binobj.toString());
    const argList = ctx.arguments().argumentList().singleExpression();
    if (argList.length === 1) {
      return `new BsonBinaryData(System.Text.Encoding.ASCII.GetBytes(${bytes}))`;
    }
    return `new BsonBinaryData(System.Text.Encoding.ASCII.GetBytes(${bytes}), ${this.binarySubTypes[type]})`;
  }

  /**
   * BSON RegExp Constructor
   *
   * @param {BSONRegExpConstructorObject} ctx - expects two strings as
   * arguments, where the second are flags
   *
   * @returns {string} - new BSONRegularExpession(patter)
   */
  emitBSONRegExp(ctx) {
    ctx.type = this.Types.RegExp;
    const argumentList = ctx.arguments().argumentList();

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
            if (Object.keys(this.bsonRegexFlags).includes(item) === false) {
              unsuppotedFlags.push(item);
            }

            return this.bsonRegexFlags[item];
          });

        if (unsuppotedFlags.length > 0) {
          throw new SemanticGenericError({
            message: `Regular expression contains unsuppoted '${unsuppotedFlags.join('')}' flag`
          });
        }

        flags = doubleQuoteStringify(flags.join(''));
      }

      return `new BsonRegularExpression(@${pattern}, ${flags})`;
    }
    return `new BsonRegularExpression(@${pattern})`;
  }

  /**
   * Special case because need to parse decimal.
   *
   * @param {FuncCallExpressionContext} ctx
   * @param {String} decimal
   * @returns {string} - new Decimal128(val)
   */
  emitDecimal128(ctx, decimal) {
    const value = parseInt(decimal.toString(), 10);
    return `new Decimal128(${value})`;
  }

  /**
   * BSON MinKey Constructor
   * needs to be in emit, since does not need a 'new' keyword
   *
   * @param {BSONMinKeyObject} ctx
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
   * @param {BSONMaxKeyObject} ctx
   *
   * @returns {string} - BsonMaxKey.Value
   */
  emitMaxKey(ctx) {
    ctx.type = this.Types.MaxKey;
    return 'BsonMaxKey.Value';
  }

  /**
   * BSON Int32 Constructor
   * depending on whether the initial value is a string or a int, need to parse
   * or convert
   *
   * @param {BSONInt32Object} ctx
   *
   * @returns {string} - Int32.Parse("value") OR Convert.ToInt32(value)
   */
  emitInt32(ctx) {
    ctx.type = this.Types.Int32;
    const args = ctx.arguments().argumentList().singleExpression();
    const expr = args[0].getText();
    if (expr.indexOf('\'') >= 0 || expr.indexOf('"') >= 0) {
      return `Int32.Parse(${doubleQuoteStringify(expr.toString())})`;
    }

    return `Convert.ToInt32(${expr})`;
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
   * @param {DateNowConstructorObject} ctx
   *
   * @returns {string} - DateTime.Now
   */

  emitnow(ctx) {
    ctx.type = this.Types.Now;
    return 'DateTime.Now';
  }
};
