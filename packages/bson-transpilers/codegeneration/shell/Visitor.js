/* eslint complexity: 0 */
const JavascriptVisitor = require('../javascript/Visitor');
const bson = require('bson');
const Context = require('context-eval');
const {
  SemanticReferenceError
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
  }

  visitIdentifierExpression(ctx) {
    const name = this.visitChildren(ctx);
    ctx.type = this.Symbols[name];
    if (ctx.type === undefined) {
      throw new SemanticReferenceError({
        message: `symbol "${name}" is undefined`
      });
    }
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
}

module.exports = Visitor;
