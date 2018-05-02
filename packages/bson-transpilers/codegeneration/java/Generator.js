/* eslint complexity: 0 */
const {doubleQuoteStringify} = require('../../helper/format');
const {
  SemanticGenericError
} = require('../../helper/error');

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
    this.binary_subTypes = {
      0: 'org.bson.BsonBinarySubType.BINARY',
      1: 'org.bson.BsonBinarySubType.FUNCTION',
      2: 'org.bson.BsonBinarySubType.BINARY',
      3: 'org.bson.BsonBinarySubType.UUID_LEGACY',
      4: 'org.bson.BsonBinarySubType.UUID_STANDARD',
      5: 'org.bson.BsonBinarySubType.MD5',
      128: 'org.bson.BsonBinarySubType.USER_DEFINED'
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
   * TODO: Maybe move this to javascript/Visitor and use template?
   *
   * child nodes: arguments
   * grandchild nodes: argumentList?
   * great-grandchild nodes: singleExpression+
   * @param {FuncCallExpressionContext} ctx
   * @return {String}
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
      return `new Binary(${bytes}.getBytes("UTF-8"))`;
    }
    return `new Binary(${this.binary_subTypes[type]}, ${bytes}.getBytes("UTF-8"))`;
  }

  emitBinData(ctx) {
    ctx.type = this.Types.BinData;
    const argList = ctx.arguments().argumentList();
    const args = this.checkArguments(this.Symbols.BinData.args, argList);

    const subtype = parseInt(argList.singleExpression()[0].getText(), 10);
    const bindata = args[1];
    if (!(subtype >= 0 && subtype <= 5 || subtype === 128)) {
      throw new SemanticGenericError({message: 'BinData subtype must be a Number between 0-5 or 128'});
    }
    if (bindata.match(/^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/)) {
      throw new SemanticGenericError({message: 'invalid base64'});
    }
    return `new Binary(${this.binary_subTypes[subtype]}, ${bindata}.getBytes("UTF-8"))`;
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
