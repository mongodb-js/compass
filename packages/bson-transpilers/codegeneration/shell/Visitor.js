/* eslint complexity: 0 */
const JavascriptVisitor = require('../javascript/Visitor');
const bson = require('bson');
const Context = require('context-eval');
const path = require('path');
const {
} = require(path.resolve('helper', 'error'));

/**
 * This is a Visitor superclass where helper methods used by all language
 * generators can be defined.
 *
 * @returns {object}
 */
function Visitor() {
  JavascriptVisitor.call(this);
  return this;
}
Visitor.prototype = Object.create(JavascriptVisitor.prototype);
Visitor.prototype.constructor = Visitor;
Visitor.prototype.new = '';

Visitor.prototype.start = Visitor.prototype.visitExpressionSequence;

Visitor.prototype.executeJavascript = function(input) {
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
      return bson.Decimal128.fromString(s);
    },
    NumberInt: function(s) {
      return parseInt(s, 10);
    },
    NumberLong: function(v) {
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
};

module.exports = Visitor;
