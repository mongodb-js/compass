/* eslint complexity: 0 */
const {doubleQuoteStringify} = require('../../helper/format');
const {
  SemanticArgumentCountMismatchError,
  SemanticGenericError,
  SemanticTypeError
} = require('../../helper/error');

module.exports = (superclass) => class ExtendedVisitor extends superclass {
  constructor() {
    super();
    this.new = 'new ';
    this.regex_flags = {
      i: 'RegexOptions.IgnoreCase',
      m: 'RegexOptions.Multiline',
      u: '',
      y: '',
      g: ''
    };
    this.binary_subTypes = {
      0: 'BsonBinarySubType.Binary',
      1: 'BsonBinarySubType.Function',
      2: 'BsonBinarySubType.OldBinary',
      3: 'BsonBinarySubType.UuidLegacy',
      4: 'BsonBinarySubType.UuidStandard',
      5: 'BsonBinarySubType.MD5',
      128: 'BsonBinarySubType.UserDefined'
    };
  }

  emitNew(ctx) {
    const expr = this.visit(ctx.singleExpression());
    ctx.type = ctx.singleExpression().type;
    return expr;
  }

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

  emitBinary(ctx) {
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
    return `new BsonBinaryData(System.Text.Encoding.ASCII.GetBytes(${bytes}), ${this.binary_subTypes[type]})`;
  }

  emitInt32(ctx) {
    ctx.type = this.Types.Int32;
    const args = ctx.arguments().argumentList().singleExpression();
    const expr = args[0].getText();
    if (expr.indexOf('\'') >= 0 || expr.indexOf('"') >= 0) {
      return `Int32.Parse(${doubleQuoteStringify(expr.toString())})`;
    }

    return `Convert.ToInt32(${expr})`;
  }

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
    const number = this.removeQuotes(this.visit(arg));

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
   * Expects two strings as arguments, the second must be valid flag
   *
   * child nodes: arguments
   * grandchild nodes: argumentList?
   * great-grandchild nodes: singleExpression+
   * @param {BSONRegExpConstructorContext} ctx
   * @return {String}
   */
  visitBSONRegExpConstructor(ctx) {
    const argumentList = ctx.arguments().argumentList();
    const BSON_FLAGS = {
      'i': 'i', // Case insensitivity to match
      'm': 'm', // Multiline match
      'x': 'x', // Ignore all white space characters
      's': 's', // Matches all
      'l': '', // Case-insensitive matching dependent on the current locale?
      'u': '' // Unicode?
    };

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

        flags = this
          .removeQuotes(flags).split('')
          .map((item) => {
            if (Object.keys(BSON_FLAGS).includes(item) === false) {
              unsuppotedFlags.push(item);
            }

            return BSON_FLAGS[item];
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
   * Child nodes: propertyName singleExpression
   * @param {PropertyAssignmentExpressionContext} ctx
   * @return {String}
   */
  visitPropertyAssignmentExpression(ctx) {
    const key = doubleQuoteStringify(this.visit(ctx.propertyName()));
    const value = this.visit(ctx.singleExpression());

    return `${key}, ${value}`;
  }

  visitPropertyNameAndValueList(ctx) {
    const childCount = ctx.getChildCount();

    if (childCount === 1) {
      return this.visitChildren(ctx);
    }

    const props = [];

    for (let i = 0; i < childCount; i += 2) {
      props.push(`{ ${this.visit(ctx.children[i])} }`);
    }

    return props.join(', ');
  }

  /**
   * Visit Code Constructor
   *
   * @param {object} ctx
   * @returns {string}
   */
  visitBSONCodeConstructor(ctx) {
    const argumentList = ctx.arguments().argumentList();

    if (
      argumentList === null ||
      (argumentList.getChildCount() !== 1 && argumentList.getChildCount() !== 3)
    ) {
      throw new SemanticArgumentCountMismatchError();
    }

    const argumentListExpression = argumentList.singleExpression();
    const code = doubleQuoteStringify(argumentListExpression[0].getText());

    if (argumentListExpression.length === 2) {
      /* NOTE: we have to visit the subtree first before type checking or type may
      not be set. We might have to just suck it up and do two passes, but maybe
      we can avoid it for now. */
      const scope = this.visit(argumentListExpression[1]);

      if (argumentListExpression[1].type !== this.Types._object) {
        throw new SemanticTypeError({
          message: 'Code requires scope to be an object'
        });
      }

      return `new BsonJavaScriptWithScope(@${code}, ${scope})`;
    }

    return `new BsonJavaScript(@${code})`;
  }

  /**
   * Visit Binary Constructor
   *
   * @param {object} ctx
   * @returns {string}
   */
  visitBSONBinaryConstructor(ctx) {
    const argumentList = ctx.arguments().argumentList();
    let type = '';
    let binobj = {};
    const subtypes = {
      0: 'BsonBinarySubType.Binary',
      1: 'BsonBinarySubType.Function',
      2: 'BsonBinarySubType.OldBinary',
      3: 'BsonBinarySubType.UuidLegacy',
      4: 'BsonBinarySubType.UuidStandard',
      5: 'BsonBinarySubType.MD5',
      128: 'BsonBinarySubType.UserDefined'
    };

    if (
      argumentList === null ||
      (argumentList.getChildCount() !== 1 && argumentList.getChildCount() !== 3)
    ) {
      throw new SemanticArgumentCountMismatchError({
        message: 'Binary requires one or two argument'
      });
    }

    try {
      binobj = this.executeJavascript(ctx.getText());
      type = binobj.sub_type;
    } catch (error) {
      throw new SemanticGenericError({message: error.message});
    }

    const argumentListExpression = argumentList.singleExpression();
    const bytes = doubleQuoteStringify(binobj.toString());

    if (argumentListExpression.length === 1) {
      return `new BsonBinaryData(System.Text.Encoding.ASCII.GetBytes(${bytes}))`;
    }

    return `new BsonBinaryData(System.Text.Encoding.ASCII.GetBytes(${bytes}), ${subtypes[type]})`;
  }

  /**
   * Visit Double Constructor
   *
   * @param {object} ctx
   * @returns {string}
   */
  visitBSONDoubleConstructor(ctx) {
    const argumentList = ctx.arguments().argumentList();

    if (argumentList === null || argumentList.getChildCount() !== 1) {
      throw new SemanticArgumentCountMismatchError({
        message: 'Double requires one argument'
      });
    }

    const arg = argumentList.singleExpression()[0];
    let double = this.removeQuotes(this.visit(arg));

    if (
      arg.type !== this.Types._string &&
      arg.type !== this.Types._decimal &&
      arg.type !== this.Types._integer
    ) {
      throw new SemanticTypeError({
        message: 'Double requires a number or a string argument'
      });
    }

    double = doubleQuoteStringify(double);

    return `new BsonDouble(Convert.ToDouble(${double}))`;
  }

  /**
   * Visit MaxKey Constructor
   *
   * @param {object} ctx
   * @returns {string}
   */
  visitBSONMaxKeyConstructor() {
    return 'BsonMaxKey.Value';
  }

  /**
   * Visit MinKey Constructor
   *
   * @param {object} ctx
   * @returns {string}
   */
  visitBSONMinKeyConstructor() {
    return 'BsonMinKey.Value';
  }

  /**
   * Visit BSON Timestamp Constructor
   *
   * @param {object} ctx
   * @returns {string}
   */
  visitBSONTimestampConstructor(ctx) {
    const argumentList = ctx.arguments().argumentList();

    if (argumentList === null || argumentList.getChildCount() !== 3) {
      throw new SemanticArgumentCountMismatchError({
        message: 'Timestamp requires two arguments'
      });
    }

    const argumentListExpression = argumentList.singleExpression();
    const low = this.visit(argumentListExpression[0]);

    if (argumentListExpression[0].type !== this.Types._integer) {
      throw new SemanticTypeError({
        message: 'Timestamp first argument requires integer arguments'
      });
    }

    const high = this.visit(argumentListExpression[1]);

    if (argumentListExpression[1].type !== this.Types._integer) {
      throw new SemanticTypeError({
        message: 'Timestamp second argument requires integer arguments'
      });
    }

    return `new BsonTimestamp(${low}, ${high})`;
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

  /**
   * TODO: Is it okay to sort by terminal?
   * Child nodes: (elision* singleExpression*)+
   *
   * @param {ElementListContext} ctx
   * @return {String}
   */
  visitElementList(ctx) {
    const children = ctx.children.filter((child) => (
      child.constructor.name !== 'TerminalNodeImpl'
    ));

    return this.visitChildren(ctx, {children, separator: ', '});
  }

  /**
   * TODO: Is it okay to sort by terminal?
   * Child nodes: (elision* singleExpression*)+
   *
   * @param {ElementListContext} ctx
   * @return {String}
   */
  visitArgumentList(ctx) {
    const children = ctx.children.filter((child) => (
      child.constructor.name !== 'TerminalNodeImpl'
    ));

    return this.visitChildren(ctx, {children, separator: ', '});
  }

  /**
   * Visit Array Literal
   *
   * @param {object} ctx
   * @returns {string}
   */
  visitArrayLiteral(ctx) {
    ctx.type = this.Types._array;

    if (ctx.getChildCount() === 2) {
      return 'new BsonArray()';
    }

    return `new BsonArray {${this.visit(ctx.elementList())}}`;
  }

  /**
   * Visit Elision Literal
   *
   * @param {object} ctx
   * @returns {string}
   */
  visitElision(ctx) {
    ctx.type = this.Types._null;

    return 'BsonNull.Value';
  }

  /**
   * Visit Null Literal
   *
   * @param {object} ctx
   * @returns {string}
   */
  visitNullLiteral(ctx) {
    ctx.type = this.Types._null;

    return 'BsonNull.Value';
  }

  /**
   * Visit Symbol Constructor
   *
   * @param {object} ctx
   * @returns {string}
   */
  visitBSONSymbolConstructor(ctx) {
    const argumentList = ctx.arguments().argumentList();

    if (argumentList === null || argumentList.getChildCount() !== 1) {
      throw new SemanticArgumentCountMismatchError({
        message: 'Symbol requires one argument'
      });
    }

    const arg = argumentList.singleExpression()[0];
    const symbol = this.visit(arg);

    if (arg.type !== this.Types._string) {
      throw new SemanticTypeError({
        message: 'Symbol requires a string argument'
      });
    }

    return `new BsonString(${symbol})`;
  }

  /**
   * Visit BSON Decimal128 Constructor
   *
   * @param {object} ctx
   * @returns {string}
   */
  visitBSONDecimal128Constructor(ctx) {
    const argumentList = ctx.arguments().argumentList();

    if (argumentList === null || argumentList.getChildCount() !== 1) {
      throw new SemanticArgumentCountMismatchError({
        message: 'Decimal128 requires one argument'
      });
    }

    const arg = argumentList.singleExpression()[0];
    const string = this.visit(arg);

    return `new BsonString(${string})`;
  }
};

