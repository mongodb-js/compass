const CodeGenerator = require('./CodeGenerator.js');

function Visitor() {
  CodeGenerator.call(this);

  return this;
}

Visitor.prototype = Object.create(CodeGenerator.prototype);
Visitor.prototype.constructor = Visitor;

// assign a string type to current ctx
// get double quotes around the string
Visitor.prototype.visitStringLiteral = function(ctx) {
  ctx.type = this.types.STRING;
  return this.doubleQuoteStringify(this.visitChildren(ctx));
};

// there is no undefined in c#
Visitor.prototype.visitUndefinedLiteral = function(ctx) {
  ctx.type = this.types.UNDEFINED;

  return 'BsonUndefined.Value';
};

// similar to java, we also want to ignore js's `new` expression, and c# always
// needs it
Visitor.prototype.visitNewExpression = function(ctx) {
  const expr = this.visit(ctx.singleExpression());
  ctx.type = ctx.singleExpression().type;
  return expr;
};

// c# does not have octal numbers, so we need to convert it to reg integer
// TODO: not sure if we should still set the type to OCTAL or INTEGER
Visitor.prototype.visitOctalIntegerLiteral = function(ctx) {
  ctx.type = this.types.OCTAL;
  return parseInt(this.visitChildren(ctx), 10);
};

/*  ************** built-in js identifiers **************** */

// adjust the Number constructor;
// returns new int(num)
Visitor.prototype.visitNumberConstructorExpression = function(ctx) {
  const argList = ctx.arguments().argumentList();

  if (!argList || argList.singleExpression().length !== 1) {
    return 'Error: Number requires one argument';
  }

  const arg = argList.singleExpression()[0];
  const number = this.removeQuotes(this.visit(arg));

  if (
    (arg.type !== this.types.STRING && this.isNumericType(arg) === false)
    || isNaN(Number(number))
  ) {
    return 'Error: Number requires a number or a string argument';
  }

  return `new int(${number})`;
};

Visitor.prototype.visitDateConstructorExpression = function(ctx) {
  const args = ctx.arguments();
  if (!args.argumentList()) return 'DateTime.Now';

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
    return error.message;
  }

  return `new DateTime(${dateStr})`;
};


// csharp doesn't allow for current time to be set on new instance, so it's
// just DateTime.Now
Visitor.prototype.visitDateNowConstructorExpression = function() {
  return 'DateTime.Now';
};

/**
 * Expects two strings as arguments, the second must be valid flag
 *
 * child nodes: arguments
 * grandchild nodes: argumentList?
 * great-grandchild nodes: singleExpression+
 * @param {BSONRegExpConstructorContext} ctx
 * @return {String}
 */
Visitor.prototype.visitBSONRegExpConstructor = function(ctx) {
  const argList = ctx.arguments().argumentList();
  const BSON_FLAGS = {
    'i': 'i', // Case insensitivity to match
    'm': 'm', // Multiline match
    'x': 'x', // Ignore all white space characters
    's': 's', // Matches all
    'l': '', // Case-insensitive matching dependent on the current locale?
    'u': '' // Unicode?
  };

  if (
    argList === null ||
    (argList.getChildCount() !== 1 && argList.getChildCount() !== 3)
  ) {
    return 'Error: BSONRegExp requires one or two arguments';
  }

  const args = argList.singleExpression();
  const pattern = this.visit(args[0]);

  if (args[0].type !== this.types.STRING) {
    return 'Error: BSONRegExp requires pattern to be a string';
  }

  if (args.length === 2) {
    let flags = this.visit(args[1]);

    if (args[1].type !== this.types.STRING) {
      return 'Error: BSONRegExp requires flags to be a string';
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
        return `Error: the regular expression contains unsuppoted '${unsuppotedFlags.join('')}' flag`;
      }

      flags = this.doubleQuoteStringify(flags.join(''));
    }

    return `new BsonRegularExpression(@${pattern}, ${flags})`;
  }
  return `new BsonRegularExpression(@${pattern})`;
};

/**
 * Child nodes: propertyName singleExpression
 * @param {PropertyAssignmentExpressionContext} ctx
 * @return {String}
 */
Visitor.prototype.propertyNameAndValueList = function(ctx) {
  const children = ctx.children.filter((child) => (
    child.constructor.name !== 'TerminalNodeImpl'
  ));

  return this.visitChildren(ctx, {children});
};

/**
 * Child nodes: propertyName singleExpression
 * @param {PropertyAssignmentExpressionContext} ctx
 * @return {String}
 */
Visitor.prototype.visitPropertyAssignmentExpression = function(ctx) {
  const key = this.doubleQuoteStringify(this.visit(ctx.propertyName()));
  const value = this.visit(ctx.singleExpression());

  return `${key}, ${value}`;
};

Visitor.prototype.visitPropertyNameAndValueList = function(ctx) {
  const childCount = ctx.getChildCount();

  if (childCount === 1) {
    return this.visitChildren(ctx);
  }

  const props = [];

  for (let i = 0; i < childCount; i += 2) {
    props.push(`{ ${this.visit(ctx.children[i])} }`);
  }

  return props.join(', ');
};

/**
 * Visit Object Literal
 *
 * @param {object} ctx
 * @returns {string}
 */
Visitor.prototype.visitObjectLiteral = function(ctx) {
  ctx.type = this.types.OBJECT;

  if (ctx.getChildCount() === 2) {
    return 'new BsonDocument()';
  }

  if (ctx.propertyNameAndValueList().getChildCount() === 1) {
    return `new BsonDocument(${this.visit(ctx.propertyNameAndValueList())})`;
  }

  const props = this.visit(ctx.propertyNameAndValueList());

  return `new BsonDocument { ${props} }`;
};

/**
 * Visit Code Constructor
 *
 * @param {object} ctx
 * @returns {string}
 */
Visitor.prototype.visitBSONCodeConstructor = function(ctx) {
  const args = ctx.arguments();

  if (
    args.argumentList() === null ||
    (
      args.argumentList().getChildCount() !== 1 &&
      args.argumentList().getChildCount() !== 3
    )
  ) {
    return 'Error: Code requires one or two arguments';
  }

  const argList = args.argumentList().singleExpression();
  const code = this.doubleQuoteStringify(argList[0].getText());

  if (argList.length === 2) {
    /* NOTE: we have to visit the subtree first before type checking or type may
     not be set. We might have to just suck it up and do two passes, but maybe
     we can avoid it for now. */
    const scope = this.visit(argList[1]);

    if (argList[1].type !== this.types.OBJECT) {
      return 'Error: Code requires scope to be an object';
    }

    return `new BsonJavaScriptWithScope(@${code}, ${scope})`;
  }

  return `new BsonJavaScript(@${code})`;
};

/**
 * This evaluates the code in a sandbox and gets the hex string out of the
 * ObjectId.
 *
 * @param {object} ctx
 * @returns {string}
 */
Visitor.prototype.visitBSONObjectIdConstructor = function(ctx) {
  const args = ctx.arguments();

  if (args.argumentList() === null) {
    return 'new BsonObjectId()';
  }

  if (args.argumentList().getChildCount() !== 1) {
    return 'Error: ObjectId requires zero or one argument';
  }

  let hexstr;

  try {
    hexstr = this.executeJavascript(ctx.getText()).toHexString();
  } catch (error) {
    return error.message;
  }

  return `new BsonObjectId(${this.doubleQuoteStringify(hexstr)})`;
};

/**
 * Visit Binary Constructor
 *
 * @param {object} ctx
 * @returns {string}
 */
Visitor.prototype.visitBSONBinaryConstructor = function(ctx) {
  const args = ctx.arguments();
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
    args.argumentList() === null ||
    (
      args.argumentList().getChildCount() !== 1 &&
      args.argumentList().getChildCount() !== 3
    )
  ) {
    return 'Error: Binary requires one or two argument';
  }

  try {
    binobj = this.executeJavascript(ctx.getText());
    type = binobj.sub_type;
  } catch (error) {
    return error.message;
  }

  const argList = args.argumentList().singleExpression();
  const bytes = this.doubleQuoteStringify(binobj.toString());

  if (argList.length === 1) {
    return `new BsonBinaryData(System.Text.Encoding.ASCII.GetBytes(${bytes}))`;
  }

  return `new BsonBinaryData(System.Text.Encoding.ASCII.GetBytes(${bytes}), ${subtypes[type]})`;
};

/**
 * Visit Double Constructor
 *
 * @param {object} ctx
 * @returns {string}
 */
Visitor.prototype.visitBSONDoubleConstructor = function(ctx) {
  const args = ctx.arguments();

  if (
    args.argumentList() === null || args.argumentList().getChildCount() !== 1
  ) {
    return 'Error: Double requires one argument';
  }

  const arg = args.argumentList().singleExpression()[0];
  let double = this.removeQuotes(this.visit(arg));

  if (arg.type !== this.types.STRING && this.isNumericType(arg) === false) {
    return 'Error: Double requires a number or a string argument';
  }

  double = this.doubleQuoteStringify(double);

  return `new BsonDouble(Convert.ToDouble(${double}))`;
};

/**
 * Visit Long Constructor
 *
 * @param {object} ctx
 * @returns {string}
 */
Visitor.prototype.visitBSONLongConstructor = function(ctx) {
  const args = ctx.arguments();

  if (
    args.argumentList() === null ||
    (
      args.argumentList().getChildCount() !== 1 &&
      args.argumentList().getChildCount() !== 3
    )
  ) {
    return 'Error: Long requires one or two argument';
  }

  let longstr = '';

  try {
    longstr = this.executeJavascript(ctx.getText()).toString();
  } catch (error) {
    return error.message;
  }

  return `new BsonInt64(Convert.ToInt32(${longstr}))`;
};

/**
 * Visit MaxKey Constructor
 *
 * @param {object} ctx
 * @returns {string}
 */
Visitor.prototype.visitBSONMaxKeyConstructor = function() {
  return 'BsonMaxKey.Value';
};

/**
 * Visit MinKey Constructor
 *
 * @param {object} ctx
 * @returns {string}
 */
Visitor.prototype.visitBSONMinKeyConstructor = function() {
  return 'BsonMinKey.Value';
};

/**
 * Visit BSON Timestamp Constructor
 *
 * @param {object} ctx
 * @returns {string}
 */
Visitor.prototype.visitBSONTimestampConstructor = function(ctx) {
  const args = ctx.arguments();

  if (
    args.argumentList() === null || args.argumentList().getChildCount() !== 3
  ) {
    return 'Error: Timestamp requires two arguments';
  }

  const argList = args.argumentList().singleExpression();
  const low = this.visit(argList[0]);

  if (argList[0].type !== this.types.INTEGER) {
    return 'Error: Timestamp first argument requires integer arguments';
  }

  const high = this.visit(argList[1]);

  if (argList[1].type !== this.types.INTEGER) {
    return 'Error: Timestamp second argument requires integer arguments';
  }

  return `new BsonTimestamp(${low}, ${high})`;
};

/**
 * Visit Object.create() Constructor
 *
 * @param {object} ctx
 * @returns {string}
 */
Visitor.prototype.visitObjectCreateConstructorExpression = function(ctx) {
  const args = ctx.arguments();

  if (
    args.argumentList() === null || args.argumentList().getChildCount() !== 1
  ) {
    return 'Error: Object.create() requires one argument';
  }

  const arg = args.argumentList().singleExpression()[0];
  const obj = this.visit(arg);

  if (arg.type !== this.types.OBJECT) {
    return 'Error: Object.create() requires an object argument';
  }

  return obj;
};

/**
 * TODO: Is it okay to sort by terminal?
 * Child nodes: (elision* singleExpression*)+
 *
 * @param {ElementListContext} ctx
 * @return {String}
 */
Visitor.prototype.visitElementList = function(ctx) {
  const children = ctx.children.filter((child) => (
    child.constructor.name !== 'TerminalNodeImpl'
  ));

  return this.visitChildren(ctx, {children, separator: ', '});
};

/**
 * Visit Array Literal
 *
 * @param {object} ctx
 * @returns {string}
 */
Visitor.prototype.visitArrayLiteral = function(ctx) {
  ctx.type = this.types.ARRAY;

  if (ctx.getChildCount() === 2) {
    return 'new BsonArray()';
  }

  return `new BsonArray {${this.visit(ctx.elementList())}}`;
};

/**
 * Visit Elision Literal
 *
 * @param {object} ctx
 * @returns {string}
 */
Visitor.prototype.visitElision = function(ctx) {
  ctx.type = this.types.NULL;

  return 'BsonNull.Value';
};

/**
 * Visit Null Literal
 *
 * @param {object} ctx
 * @returns {string}
 */
Visitor.prototype.visitNullLiteral = function(ctx) {
  ctx.type = this.types.NULL;

  return 'BsonNull.Value';
};

/**
 * Visit Symbol Constructor
 *
 * @param {object} ctx
 * @returns {string}
 */
Visitor.prototype.visitBSONSymbolConstructor = function(ctx) {
  const args = ctx.arguments();

  if (
    args.argumentList() === null || args.argumentList().getChildCount() !== 1
  ) {
    return 'Error: Symbol requires one argument';
  }

  const arg = args.argumentList().singleExpression()[0];
  const symbol = this.visit(arg);

  if (arg.type !== this.types.STRING) {
    return 'Error: Symbol requires a string argument';
  }

  return `new BsonString(${symbol})`;
};


module.exports = Visitor;
