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

  // c# does not have octal numbers, so we need to convert it to reg integer
  // TODO: not sure if we should still set the type to OCTAL or INTEGER
  visitOctalIntegerLiteral(ctx) {
    ctx.type = this.Types._octal;

    return parseInt(this.visitChildren(ctx), 10);
  }

  /*  ************** built-in js identifiers **************** */

  // adjust the Number constructor;
  // returns new int(num)
  visitNumberConstructorExpression(ctx) {
    const argList = ctx.arguments().argumentList();

    if (!argList || argList.singleExpression().length !== 1) {
      throw new SemanticArgumentCountMismatchError({
        message: 'Number requires one argument'
      });
    }

    const arg = argList.singleExpression()[0];
    const number = removeQuotes(this.visit(arg));

    if (
      (
        arg.type !== this.Types._string &&
        arg.type !== this.Types._decimal &&
        arg.type !== this.Types._integer
      )
      || isNaN(Number(number))
    ) {
      throw new SemanticTypeError({
        message: 'Number requires a number or a string argument'
      });
    }

    return `new int(${number})`;
  }

  visitDateConstructorExpression(ctx) {
    const argumentList = ctx.arguments().argumentList();

    if (argumentList === null) {
      return 'DateTime.Now';
    }

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

  // csharp doesn't allow for current time to be set on new instance, so it's
  // just DateTime.Now
  visitDateNowConstructorExpression() {
    return 'DateTime.Now';
  }

  /**
   * Visit Object.create() Constructor
   *
   * @param {object} ctx
   * @returns {string}
   */
  visitObjectCreateConstructorExpression(ctx) {
    const argumentList = ctx.arguments().argumentList();

    if (argumentList === null || argumentList.getChildCount() !== 1) {
      throw new SemanticArgumentCountMismatchError({
        message: 'Object.create() requires one argument'
      });
    }

    const arg = argumentList.singleExpression()[0];
    const obj = this.visit(arg);

    if (arg.type !== this.Types._object) {
      throw new SemanticTypeError({
        message: 'Object.create() requires an object argument'
      });
    }

    return obj;
  }
};
