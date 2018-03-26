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
  return 'null';
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
    }

    flags = this.doubleQuoteStringify(flags.join(''));

    return `new BsonRegularExpression(@${pattern}, ${flags})`;
  }
  return `new BsonRegularExpression(@${pattern})`;
};

module.exports = Visitor;
