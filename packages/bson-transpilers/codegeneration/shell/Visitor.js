/* eslint complexity: 0 */
const JavascriptVisitor = require('../javascript/Visitor');
const bson = require('bson');
const Context = require('context-eval');
const {
  BsonCompilersReferenceError,
  BsonCompilersRuntimeError,
  BsonCompilersUnimplementedError,
  BsonCompilersArgumentError
} = require('../../helper/error');

/**
 * This is a Visitor superclass where helper methods used by all language
 * generators can be defined.
 *
 * @returns {object}
 */
class Visitor extends JavascriptVisitor {
  constructor() {
    super();
    this.new = '';
    this.processNumberLong = this.processNumber;
  }

  visitIdentifierExpression(ctx) {
    const name = this.visitChildren(ctx);
    ctx.type = this.Symbols[name];
    if (ctx.type === undefined) {
      throw new BsonCompilersReferenceError(
        `Symbol '${name}' is undefined`
      );
    }
    this.requiredImports[ctx.type.code] = true;
    // Special case MinKey/MaxKey because they don't have to be called in shell
    if (!ctx.visited && (ctx.type.id === 'MinKey' || ctx.type.id === 'MaxKey') &&
        ctx.parentCtx.constructor.name !== 'FuncCallExpressionContext' &&
        ctx.parentCtx.constructor.name !== 'NewExpressionContext') {
      const node = {
        arguments: () => { return { argumentList: () => { return false; }}; },
        singleExpression: () => { return ctx; }
      };
      ctx.visited = true;
      return this.visitFuncCallExpression(node);
    }
    if (ctx.type.template) {
      return ctx.type.template();
    }
    return name;
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
    throw new BsonCompilersUnimplementedError('BinData type not supported');
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
      throw new BsonCompilersRuntimeError(error.message);
    }

    if ('emitNumberDecimal' in this) {
      return this.emitNumberDecimal(ctx, decstr);
    }
    const lhs = symbolType.template ? symbolType.template() : 'NumberDecimal';
    const rhs = symbolType.argsTemplate ? symbolType.argsTemplate(lhs, decstr) : `(${decstr})`;
    return `${this.new}${lhs}${rhs}`;
  }

  /**
   * Needs preprocessing because ISODate is treated exactly like Date.
   *
   * @param {FuncCallExpressionContext} ctx
   * @return {String}
   */
  processISODate(ctx) {
    return this.processDate(ctx);
  }

  /**
   * We want to ensure that the scope argument is not generated as a builder if
   * idiomatic is turned on
   * @param {FuncCallExpressionContext} ctx
   * @return {String}
   */
  processCode(ctx) {
    ctx.type = this.Types.Code;
    const symbolType = this.Symbols.Code;
    const lhs = symbolType.template ? symbolType.template() : 'Code';
    const argList = ctx.arguments().argumentList();
    if (!argList ||
      !(argList.singleExpression().length === 1 ||
        argList.singleExpression().length === 2)) {
      return `${this.new}${lhs}${symbolType.argsTemplate ? symbolType.argsTemplate(lhs) : '()'}`;
    }
    const args = argList.singleExpression();
    const code = this.visit(args[0]);
    let scope = undefined;
    let scopestr = '';

    if (args.length === 2) {
      const idiomatic = this.idiomatic;
      this.idiomatic = false;
      scope = this.visit(args[1]);
      this.idiomatic = idiomatic;
      scopestr = `, ${scope}`;
      if (args[1].type !== this.Types._object) {
        throw new BsonCompilersArgumentError(
          'Argument type mismatch: Code requires scope to be an object'
        );
      }
      this.requiredImports[113] = true;
      this.requiredImports[10] = true;
    }
    if ('emitCode' in this) {
      return this.emitCode(ctx, code, scope);
    }
    const rhs = symbolType.argsTemplate ? symbolType.argsTemplate(lhs, code, scope) : `(${code}${scopestr})`;
    return `${this.new}${lhs}${rhs}`;
  }

}

module.exports = Visitor;
