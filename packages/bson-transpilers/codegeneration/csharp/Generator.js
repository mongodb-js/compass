const CodeGenerator = require('../javascript/Visitor.js');
const path = require('path');

const {
  SemanticArgumentCountMismatchError,
  SemanticGenericError,
  SemanticTypeError
} = require(path.resolve('helper', 'error'));
const {Types} = require('./SymbolTable');

class Visitor extends CodeGenerator {
  // assign a string type to current ctx
  // get double quotes around the string
  visitStringLiteral(ctx) {
    ctx.type = Types._string;

    return this.doubleQuoteStringify(this.visitChildren(ctx));
  }

  // there is no undefined in c#
  visitUndefinedLiteral(ctx) {
    ctx.type = Types._undefined;

    return 'BsonUndefined.Value';
  }

  // similar to java, we also want to ignore js's `new` expression, and c# always
  // needs it
  visitNewExpression(ctx) {
    const expr = this.visit(ctx.singleExpression());

    ctx.type = ctx.singleExpression().type;

    return expr;
  }

  // c# does not have octal numbers, so we need to convert it to reg integer
  // TODO: not sure if we should still set the type to OCTAL or INTEGER
  visitOctalIntegerLiteral(ctx) {
    ctx.type = Types._octal;

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
        arg.type !== Types._string &&
        arg.type !== Types._decimal &&
        arg.type !== Types._integer
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

    if (args[0].type !== Types._string) {
      throw new SemanticTypeError({
        message: 'BSONRegExp requires pattern to be a string'
      });
    }

    if (args.length === 2) {
      let flags = this.visit(args[1]);

      if (args[1].type !== Types._string) {
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

        flags = this.doubleQuoteStringify(flags.join(''));
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
    const key = this.doubleQuoteStringify(this.visit(ctx.propertyName()));
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
   * Visit Object Literal
   *
   * @param {object} ctx
   * @returns {string}
   */
  visitObjectLiteral(ctx) {
    ctx.type = Types._object;

    if (ctx.getChildCount() === 2) {
      return 'new BsonDocument()';
    }

    if (ctx.propertyNameAndValueList().getChildCount() === 1) {
      return `new BsonDocument(${this.visit(ctx.propertyNameAndValueList())})`;
    }

    const props = this.visit(ctx.propertyNameAndValueList());

    return `new BsonDocument { ${props} }`;
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
    const code = this.doubleQuoteStringify(argumentListExpression[0].getText());

    if (argumentListExpression.length === 2) {
      /* NOTE: we have to visit the subtree first before type checking or type may
      not be set. We might have to just suck it up and do two passes, but maybe
      we can avoid it for now. */
      const scope = this.visit(argumentListExpression[1]);

      if (argumentListExpression[1].type !== Types._object) {
        throw new SemanticTypeError({
          message: 'Code requires scope to be an object'
        });
      }

      return `new BsonJavaScriptWithScope(@${code}, ${scope})`;
    }

    return `new BsonJavaScript(@${code})`;
  }

  /**
   * This evaluates the code in a sandbox and gets the hex string out of the
   * ObjectId.
   *
   * @param {object} ctx
   * @returns {string}
   */
  visitBSONObjectIdConstructor(ctx) {
    const argumentList = ctx.arguments().argumentList();

    if (argumentList === null) {
      return 'new BsonObjectId()';
    }

    if (argumentList.getChildCount() !== 1) {
      throw new SemanticArgumentCountMismatchError({
        message: 'ObjectId requires zero or one argument'
      });
    }

    let hexstr;

    try {
      hexstr = this.executeJavascript(ctx.getText()).toHexString();
    } catch (error) {
      throw new SemanticGenericError({message: error.message});
    }

    return `new BsonObjectId(${this.doubleQuoteStringify(hexstr)})`;
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
    const bytes = this.doubleQuoteStringify(binobj.toString());

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
      arg.type !== Types._string &&
      arg.type !== Types._decimal &&
      arg.type !== Types._integer
    ) {
      throw new SemanticTypeError({
        message: 'Double requires a number or a string argument'
      });
    }

    double = this.doubleQuoteStringify(double);

    return `new BsonDouble(Convert.ToDouble(${double}))`;
  }

  /**
   * Visit Long Constructor
   *
   * @param {object} ctx
   * @returns {string}
   */
  visitBSONLongConstructor(ctx) {
    const argumentList = ctx.arguments().argumentList();

    if (
      argumentList === null ||
      (argumentList.getChildCount() !== 1 && argumentList.getChildCount() !== 3)
    ) {
      throw new SemanticArgumentCountMismatchError({
        message: 'Long requires one or two argument'
      });
    }

    let longstr = '';

    try {
      longstr = this.executeJavascript(ctx.getText()).toString();
    } catch (error) {
      throw new SemanticGenericError({message: error.message});
    }

    return `new BsonInt64(Convert.ToInt32(${longstr}))`;
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

    if (argumentListExpression[0].type !== Types._integer) {
      throw new SemanticTypeError({
        message: 'Timestamp first argument requires integer arguments'
      });
    }

    const high = this.visit(argumentListExpression[1]);

    if (argumentListExpression[1].type !== Types._integer) {
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

    if (arg.type !== Types._object) {
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
    ctx.type = Types._array;

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
    ctx.type = Types._null;

    return 'BsonNull.Value';
  }

  /**
   * Visit Null Literal
   *
   * @param {object} ctx
   * @returns {string}
   */
  visitNullLiteral(ctx) {
    ctx.type = Types._null;

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

    if (arg.type !== Types._string) {
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
}

module.exports = Visitor;
