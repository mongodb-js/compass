/* eslint complexity: 0 */
const bson = require('bson');
const Context = require('context-eval');
const {
  BsonTranspilersRuntimeError,
  BsonTranspilersUnimplementedError
} = require('../../helper/error');

/**
 * This is a visitor for the shell syntax. It inherits from the javascript visitor
 * directly.
 *
 * @param {JavascriptVisitor} JavascriptVisitor - The javascript input-language
 * specific visitor.
 * @return {Visitor} - Input-language specific visitor.
 */
module.exports = (JavascriptVisitor) => class Visitor extends JavascriptVisitor {
  constructor() {
    super();
  }

  processNumberLong(ctx) {
    return this.generateNumericClass(ctx);
  }
  executeJavascript(input) {
    const sandbox = {
      RegExp: RegExp,
      DBRef: bson.DBRef,
      Map: bson.Map,
      MaxKey: bson.MaxKey,
      MinKey: bson.MinKey,
      ObjectId: bson.ObjectID,
      Symbol: bson.Symbol,
      Timestamp: bson.Timestamp,
      Code: function(c, s) {
        return new bson.Code(c, s);
      },
      NumberDecimal: function(s) {
        if (s === undefined) {
          s = '0';
        }
        return bson.Decimal128.fromString(s.toString());
      },
      NumberInt: function(s) {
        return parseInt(s, 10);
      },
      NumberLong: function(v) {
        if (v === undefined) {
          v = 0;
        }
        return bson.Long.fromNumber(v);
      },
      ISODate: function(s) {
        return new Date(s);
      },
      Date: function(s) {
        const args = Array.from(arguments);

        if (args.length === 1) {
          return new Date(s);
        }

        return new Date(Date.UTC(...args));
      },
      Buffer: Buffer,
      __result: {}
    };
    const ctx = new Context(sandbox);
    const res = ctx.evaluate('__result = ' + input);
    ctx.destroy();
    return res;
  }

  /**
   * BinData needs extra processing because we need to check that the arg is
   * valid base64.
   *
   * TODO: figure out if it ever makes sense to support Binary.
   */
  processBinData() {
    throw new BsonTranspilersUnimplementedError('BinData type not supported');
  }

  /**
   * Needs preprocessing because must be executed in javascript.
   *
   * @param {FuncCallExpressionContext} ctx
   * @return {String}
   */
  processNumberDecimal(ctx) {
    ctx.type = this.Types.NumberDecimal;
    const symbolType = this.Symbols.NumberDecimal;
    let decstr;
    try {
      decstr = this.executeJavascript(`new ${ctx.getText()}`).toString();
    } catch (error) {
      throw new BsonTranspilersRuntimeError(error.message);
    }

    if ('emitNumberDecimal' in this) {
      return this.emitNumberDecimal(ctx, decstr);
    }
    const lhs = symbolType.template ? symbolType.template() : 'NumberDecimal';
    const rhs = symbolType.argsTemplate ? symbolType.argsTemplate(lhs, decstr) : `(${decstr})`;
    return this.Syntax.new.template
      ? this.Syntax.new.template(`${lhs}${rhs}`, false, ctx.type.code)
      : `${lhs}${rhs}`;
  }

  /**
   * Needs preprocessing because ISODate is treated exactly like Date, but always
   * is invoked as an object.
   *
   * @param {FuncCallExpressionContext} ctx
   * @return {String}
   */
  processISODate(ctx) {
    ctx.wasNew = true;
    return this.processDate(ctx);
  }

  /**
   * Also accepts no arguments.
   *
   * @param {FuncCallExpressionContext} ctx
   * @return {String}
   */
  processCode(ctx) {
    ctx.type = this.Types.Code;
    const symbolType = this.Symbols.Code;
    const lhs = symbolType.template ? symbolType.template() : 'Code';
    if (this.getArguments(ctx).length === 0) {
      const code = `${lhs}${symbolType.argsTemplate ? symbolType.argsTemplate(lhs) : '()'}`;
      return this.Syntax.new.template
        ? this.Syntax.new.template(code, false, ctx.type.code)
        : code;
    }
    return this.generateBSONCode(ctx, ctx.type, symbolType, true);
  }
};
