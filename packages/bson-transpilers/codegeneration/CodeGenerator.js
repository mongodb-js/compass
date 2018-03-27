/* eslint complexity: 0 */
const ECMAScriptVisitor = require('../lib/ECMAScriptVisitor').ECMAScriptVisitor;
const bson = require('bson');
const Context = require('context-eval');
const {
  Types,
  SYMBOL_TYPE,
  BsonSymbols,
  JSSymbols,
  Symbols
} = require('./SymbolTable');

/**
 * This is a Visitor superclass where helper methods used by all language
 * generators can be defined.
 *
 * @returns {object}
 */
function Visitor() {
  ECMAScriptVisitor.call(this);
  return this;
}
Visitor.prototype = Object.create(ECMAScriptVisitor.prototype);
Visitor.prototype.constructor = Visitor;

Visitor.prototype.start = Visitor.prototype.visitExpressionSequence;

/**
 * Selectively visits children of a node.
 *
 * @param {ParserRuleContext} ctx
 * @param {Object} options:
 *    start - child index to start iterating at.
 *    end - child index to end iterating after.
 *    step - how many children to increment each step, 1 visits all children.
 *    separator - a string separator to go between children.
 *    ignore - an array of child indexes to skip.
 *    children - the set of children to visit.
 * @returns {String}
 */
Visitor.prototype.visitChildren = function(ctx, options) {
  const opts = {
    start: 0, step: 1, separator: '', ignore: [], children: ctx.children
  };
  Object.assign(opts, options ? options : {});
  opts.end = ('end' in opts) ? opts.end : opts.children.length - 1;

  let code = '';
  for (let i = opts.start; i <= opts.end; i += opts.step) {
    if (opts.ignore.indexOf(i) === -1) {
      code += this.visit(opts.children[i]) + (i === opts.end ? '' : opts.separator);
    }
  }
  /* Set the node's type to the first child, if it's not already set.
     More often than not, type will be set directly by the visitNode method. */
  if (ctx.type === undefined) {
    ctx.type = opts.children.length ? opts.children[0].type : Types._undefined;
  }
  return code.trim();
};

Visitor.prototype.visitLiteralExpression = function(ctx) {
  ctx.type = this.getPrimitiveType(ctx.literal());

  if (`emit${ctx.type.id}` in this) {
    return this[`emit${ctx.type.id}`](ctx);
  }

  if (ctx.type.template) {
    return ctx.type.template(this.visitChildren(ctx));
  }

  return this.visitChildren(ctx);
};

Visitor.prototype.visitFuncCallExpression = function(ctx) {
  this.visit(ctx.singleExpression());
  const lhsType = ctx.singleExpression().type;

  // Special case types
  if (`emit${lhsType.id}` in this) {
    return this[`emit${lhsType.id}`](ctx);
  }

  return this.emitType(ctx);
};

Visitor.prototype.visitBSONIdentifierExpression = function(ctx) {
  const name = this.visitChildren(ctx);
  ctx.type = BsonSymbols[name];
  if (ctx.type === undefined) {
    throw `Error: symbol "${name}" is undefined`;
  }
  if (ctx.type.template) {
    return ctx.type.template();
  }
  return name;
};

Visitor.prototype.visitJSIdentifierExpression = function(ctx) {
  const name = this.visitChildren(ctx);
  ctx.type = JSSymbols[name];
  if (ctx.type === undefined) {
    throw `Error: symbol '${name}' is undefined`;
  }
  if (ctx.type.template) {
    return ctx.type.template();
  }
  return name;
};

Visitor.prototype.visitIdentifierExpression = function(ctx) {
  const name = this.visitChildren(ctx);
  ctx.type = Symbols[name];
  if (ctx.type === undefined) {
    throw `Error: symbol "${name}" is undefined`;
  }
  if (ctx.type.template) {
    return ctx.type.template();
  }
  return name;
};

// TODO: Attribute access: first check if key is in type.attr, if not then check if the type.type has attrs. Recur until type is a primitive type, if nothing there, then just emit directly unless BSON or JS type.
Visitor.prototype.visitMemberDotExpression = function(ctx) {
  const lhs = this.visit(ctx.singleExpression());
  const lhsType = ctx.singleExpression().type;

  const rhs = this.visit(ctx.identifierName());

  if (!(rhs in lhsType.attr)) {
    throw `Error: ${rhs} not an attribute of ${lhsType.id}`;
  }
  ctx.type = lhsType.attr[rhs];
  if (lhsType.attr[rhs].template) {
    return lhsType.attr[rhs].template(lhs, rhs);
  }

  return `${lhs}.${rhs}`;
};


/**
 * Visit a leaf node and return a string.
 * *
 * @param {ParserRuleContext} ctx
 * @returns {String}
 */
Visitor.prototype.visitTerminal = function(ctx) {
  return ctx.getText();
};

// //////////
// Helpers //
// //////////
/**
 * Get the type of a node. TODO: nicer way to write it?
 * @param {LiteralContext} ctx
 * @return {Symbol}
 */
Visitor.prototype.getPrimitiveType = function(ctx) {
  if ('NullLiteral' in ctx) {
    return Types._null;
  }
  if ('UndefinedLiteral' in ctx) {
    return Types._undefined;
  }
  if ('BooleanLiteral' in ctx) {
    return Types._bool;
  }
  if ('StringLiteral' in ctx) {
    return Types._string;
  }
  if ('RegularExpressionLiteral' in ctx) {
    return Types._regex;
  }
  if ('numericLiteral' in ctx) {
    const number = ctx.numericLiteral();
    if ('IntegerLiteral' in number) {
      return Types._integer;
    }
    if ('DecimalLiteral' in number) {
      return Types._decimal;
    }
    if ('HexIntegerLiteral' in number) {
      return Types._hex;
    }
    if ('OctalIntegerLiteral' in number) {
      return Types._octal;
    }
  }
  // TODO: or raise error?
  return Types._undefined;
};

Visitor.prototype.executeJavascript = function(input) {
  const sandbox = {
    RegExp: RegExp,
    BSONRegExp: bson.BSONRegExp,
    Binary: bson.Binary,
    DBRef: bson.DBRef,
    Decimal128: bson.Decimal128,
    Double: bson.Double,
    Int32: bson.Int32,
    Long: bson.Long,
    Int64: bson.Long,
    Map: bson.Map,
    MaxKey: bson.MaxKey,
    MinKey: bson.MinKey,
    ObjectID: bson.ObjectID,
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

/**
 *
 * @param {Array} expected - An array of tuples where each tuple represents possible argument types for that index.
 * @param {ArgumentListContext} argumentList - null if empty.
 *
 * @returns {String}
 */
Visitor.prototype.checkArguments = function(expected, argumentList) {
  let argStr = '';
  if (!argumentList) {
    if (expected.length === 0) {
      return argStr;
    }
    throw 'Error: arguments required';
  }
  const args = argumentList.singleExpression();
  if (args.length > expected.length) {
    throw 'Error: too many arguments';
  }
  for (let i = 0; i < expected.length; i++) {
    if (args[i] === undefined) {
      if (expected[i].indexOf(null) !== -1) {
        return argStr;
      }
      throw 'Error: too few arguments';
    }
    if (i !== 0) {
      argStr += ', ';
    }
    argStr += this.visit(args[i]);
    if (expected[i].indexOf(Types._numeric) !== -1 && (
        args[i].type === Types._integer ||
        args[i].type === Types._decimal ||
        args[i].type === Types._hex ||
        args[i].type === Types._octal)) {
      continue;
    }
    if (expected[i].indexOf(args[i].type) === -1 && expected[i].indexOf(args[i].type.id) === -1) {
      throw `Error: expected types ${expected[i].map((e) => {
        return e.id ? e.id : e;
      })} but got type ${args[i].type.id} for argument at index ${i}`;
    }
  }
  return argStr;
};

// /////////////
// Emit type  //
// /////////////
/**
 * @param {FuncCallExpressionContext} ctx
 * @return {String}
 */
Visitor.prototype.emitType = function(ctx) {
  const lhs = this.visit(ctx.singleExpression());
  const lhsType = ctx.singleExpression().type;
  const expectedArgs = lhsType.args;
  const rhs = this.checkArguments(expectedArgs, ctx.arguments().argumentList());

  ctx.type = lhsType.type;
  if (!lhsType.callable) {
    throw `Error: ${lhsType.id} is not callable`;
  }
  const newStr = lhsType.callable === SYMBOL_TYPE.CONSTRUCTOR ? 'new ' : '';

  return `${newStr}${lhs}(${rhs})`;
};


module.exports = Visitor;
