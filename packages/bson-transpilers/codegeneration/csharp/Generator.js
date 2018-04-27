/* eslint complexity: 0 */
const { doubleQuoteStringify, removeQuotes } = require('../../helper/format');
const {
  SemanticArgumentCountMismatchError,
  SemanticGenericError,
  SemanticTypeError
} = require('../../helper/error');

module.exports = (superclass) => class ExtendedVisitor extends superclass {
  constructor() {
    super();
    this.new = 'new ';
    this.regexFlags = {
      i: 'RegexOptions.IgnoreCase',
      m: 'RegexOptions.Multiline',
      u: '',
      y: '',
      g: ''
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
   * BSON Code
   *
   * @param {BSONCodeObject} ctx
   *
   * @returns {string} - new BsonJavaScript(code)
   */
  emitCodeFromJS(ctx) {
    ctx.type = this.Types.Code;
    const argList = ctx.arguments().argumentList();
    if (!argList ||
      !(argList.singleExpression().length === 1 ||
        argList.singleExpression().length === 2)) {
      throw new SemanticArgumentCountMismatchError({
        message: 'Code requires one or two arguments'
      });
    }
    const args = argList.singleExpression();
    const code = doubleQuoteStringify(args[0].getText());

    if (args.length === 2) {
      const scope = this.visit(args[1]);
      if (args[1].type !== this.Types._object) {
        throw new SemanticTypeError({
          message: 'Code requires scope to be an object'
        });
      }
      return `new BsonJavaScriptWithScope(@${code}, ${scope})`;
    }

    return `new BsonJavaScript(@${code})`;
  }

  /**
   * BSON ObjectID
   * needs to execute JS to get value first
   *
   * @param {BSONObjectIdObject} ctx
   *
   * @returns {string} - new BsonObjectId()
   */
  emitObjectId(ctx) {
    ctx.type = this.Types.ObjectId;
    if (!ctx.arguments().argumentList()) return 'new BsonObjectId()';

    let hexstr;
    try {
      hexstr = this.executeJavascript(ctx.getText()).toHexString();
    } catch (error) {
      throw new SemanticGenericError({message: error.message});
    }
    return `new BsonObjectId(${doubleQuoteStringify(hexstr)})`;
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
   * BSON Decimal128 Constructor
   *
   * @param {Decimal128ConstructorObject} ctx
   *
   * @returns {string} - new Decimal128(val)
   */
  emitDecimal128(ctx) {
    ctx.type = this.Types.Decimal128;

    let decimal;
    try {
      decimal = this.executeJavascript(`new ${ctx.getText()}`);
    } catch (error) {
      throw new SemanticGenericError({message: error.message});
    }
    const value = parseInt(decimal.toString(), 10);

    return `new Decimal128(${value})`;
  }

  /**
   * BSON Long Constructor
   * needs to execute JS, and add a conversion to int32 for c#
   *
   * @param {BSONLongObject} ctx
   *
   * @returns {string} - new BsonInt64(Convert.ToInt32(value))
   */
  emitLong(ctx) {
    ctx.type = this.Types.Long;
    let longstr;
    try {
      longstr = this.executeJavascript(ctx.getText()).toString();
    } catch (error) {
      throw new SemanticGenericError({message: error.message});
    }
    return `new BsonInt64(Convert.ToInt32(${longstr}))`;
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
   * Date Time
   *
   * @param {DateTimeConstructorObject} ctx
   *
   * @returns {string} - DateTime(date)
   */
  emitDate(ctx) {
    ctx.type = this.Types.Date;
    if (!ctx.arguments().argumentList()) return 'DateTime.Now';

    let dateStr;

    try {
      const epoch = this.executeJavascript(ctx.getText());

      dateStr = [
        epoch.getUTCFullYear(),
        (epoch.getUTCMonth() + 1),
        epoch.getUTCDate(),
        epoch.getUTCHours(),
        epoch.getUTCMinutes(),
        epoch.getUTCSeconds()
      ].join(', ');
    } catch (error) {
      throw new SemanticGenericError({message: error.message});
    }

    return `new DateTime(${dateStr})`;
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

  emitRegExp(ctx) {
    ctx.type = this.Types.Regex;
    let pattern;
    let flags;

    try {
      const regexobj = this.executeJavascript(ctx.getText());
      pattern = regexobj.source;
      flags = regexobj.flags;
    } catch (error) {
      return error.message;
    }

    // we need to pipe ( "|" ) flags in csharp if there is more than one of them
    const csharpflags = flags.replace(/[imuyg]/g, (m) => {
      if (m === flags[flags.length - 1]) {
        return this.regexFlags[m];
      }
      if (this.regexFlags[m] !== '' && flags.length > 1) {
        return this.regexFlags[m] + ' | ';
      }
      return this.regexFlags[m];
    });

    const regex = csharpflags === '' ?
      `new Regex(${doubleQuoteStringify(pattern)})`
      : `new Regex(${doubleQuoteStringify(pattern)}, ${csharpflags})`;

    return regex;
  }
};
