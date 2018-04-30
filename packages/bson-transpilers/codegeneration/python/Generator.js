
/* eslint complexity: 0 */
const path = require('path');

const {
  singleQuoteStringify,
  doubleQuoteStringify,
  removeQuotes
} = require(path.resolve('helper', 'format'));
const {
  SemanticArgumentCountMismatchError,
  SemanticGenericError,
  SemanticTypeError
} = require(path.resolve('helper', 'error'));

/**
 * Handling emit methods binded with visitor.
 *
 * @param {class} superClass
 * @returns {object}
 */
module.exports = (superClass) => class ExtendedVisitor extends superClass {
  constructor() {
    super();
    this.regexFlags = {
      i: 'i', // re.IGNORECASE
      m: 'm', // re.MULTILINE
      u: 'a', // re.ASCII
      y: '', // Sticky flag matches only from the index indicated by the lastIndex property
      g: 's' // re.DOTALL matches all
      // re.DEBUG - Display debug information. No corresponding inline flag.
      // re.LOCALE - Case-insensitive matching dependent on the current locale. Inline flag (?L)
      // re.VERBOSE - More readable way of writing patterns (eg. with comments)
    };
    this.regexBSONFlags = {
      'i': 'i', // Case insensitivity to match
      'm': 'm', // Multiline match
      'x': 'x', // Ignore all white space characters
      's': 's', // Matches all
      'l': 'l', // Case-insensitive matching dependent on the current locale?
      'u': 'u' // Unicode?
    };
    // Python supports bson.binary.CSHARP_LEGACY but currently js symbols/javascript/symbols.yaml
    // doesn't contains this sup type
    this.binarySubTypes = {
      0: 'bson.binary.BINARY_SUBTYPE',
      1: 'bson.binary.FUNCTION_SUBTYPE',
      2: 'bson.binary.OLD_BINARY_SUBTYPE',
      3: 'bson.binary.OLD_UUID_SUBTYPE',
      4: 'bson.binary.UUID_SUBTYPE',
      5: 'bson.binary.MD5_SUBTYPE',
      6: 'bson.binary.CSHARP_LEGACY',
      128: 'bson.binary.USER_DEFINED_SUBTYPE'
    };
  }

  /**
   * Because Python doesn't need `New`, we can skip the first child.
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
   * Special cased bc they're different in every lang.
   *
   * child nodes: arguments
   * grandchild nodes: argumentList?
   * great-grandchild nodes: singleExpression+
   *
   * @param {FuncCallExpressionContext} ctx
   * @return {String}
   */
  emitRegExp(ctx) {
    let pattern;
    let flags;

    try {
      const regexobj = this.executeJavascript(ctx.getText());

      pattern = regexobj.source;
      flags = regexobj.flags;
    } catch (error) {
      throw new SemanticGenericError({message: error.message});
    }

    // Double escape characters except for slashes
    const escaped = pattern.replace(/\\(?!\/)/, '\\\\');

    if (flags !== '') {
      flags = flags
        .split('')
        .map((item) => this.regexFlags[item])
        .sort()
        .join('');

      return `re.compile(r${doubleQuoteStringify(`${escaped}(?${flags})`)})`;
    }

    return `re.compile(r${doubleQuoteStringify(escaped)})`;
  }

  /**
   * Special cased because different target languages need different info out
   * of the constructed date.
   *
   * child nodes: arguments
   * grandchild nodes: argumentList?
   * great-grandchild nodes: singleExpression+
   *
   * @param {FuncCallExpressionContext} ctx
   * @return {String}
   */
  emitDate(ctx) {
    const argumentList = ctx.arguments().argumentList();
    let toStr = '';
    if (!ctx.wasNew && this.visit(ctx.singleExpression()) !== 'ISODate') {
      ctx.type = this.Types._string;
      toStr = '.strftime(\'%a %b %d %Y %H:%M:%S %Z\')';
    }

    if (argumentList === null) {
      return `datetime.datetime.utcnow().date()${toStr}`;
    }

    let dateStr = '';

    try {
      const date = this.executeJavascript(ctx.getText());

      dateStr = [
        date.getUTCFullYear(),
        (date.getUTCMonth() + 1),
        date.getUTCDate(),
        date.getUTCHours(),
        date.getUTCMinutes(),
        date.getUTCSeconds()
      ].join(', ');
    } catch (error) {
      throw new SemanticGenericError({message: error.message});
    }

    return `datetime.datetime(${dateStr}, tzinfo=datetime.timezone.utc)${toStr}`;
  }

  /**
   * Expects two strings as arguments, the second must contain any of "imxlsu".
   *
   * child nodes: arguments
   * grandchild nodes: argumentList?
   * great-grandchild nodes: singleExpression+
   *
   * @param {FuncCallExpressionContext} ctx
   * @return {String}
   */
  emitBSONRegExp(ctx) {
    const argumentList = ctx.arguments().argumentList();

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

        flags = removeQuotes(flags).split('')
          .map((item) => {
            if (Object.keys(this.regexBSONFlags).includes(item) === false) {
              unsuppotedFlags.push(item);
            }

            return this.regexBSONFlags[item];
          });

        if (unsuppotedFlags.length > 0) {
          throw new SemanticGenericError({
            message: `Regular expression contains unsuppoted '${unsuppotedFlags.join('')}' flag`
          });
        }

        flags = singleQuoteStringify(flags.join(''));
      }

      return `Regex(${pattern}, ${flags})`;
    }

    return `Regex(${pattern})`;
  }

  /**
   * The arguments to Code can be either a string or actual javascript code.
   * Manually check arguments here because first argument can be any JS, and we
   * don't want to ever visit that node.
   *
   * TODO: could move this to javascript/visitor and use template.
   *
   * child nodes: arguments
   * grandchild nodes: argumentList?
   * great-grandchild nodes: singleExpression+
   *
   * @param {FuncCallExpressionContext} ctx
   * @return {String}
   */
  emitCodeFromJS(ctx) {
    ctx.type = this.Types.Code;
    const argList = ctx.arguments().argumentList();
    if (
      !argList ||
      !(
        argList.singleExpression().length === 1 ||
        argList.singleExpression().length === 2
      )
    ) {
      throw new SemanticArgumentCountMismatchError({
        message: 'Code requires one or two arguments'
      });
    }

    const args = argList.singleExpression();
    const code = singleQuoteStringify(args[0].getText());

    if (args.length === 2) {
      /* NOTE: we have to visit the subtree first before type checking or type may
        not be set. We might have to just suck it up and do two passes, but maybe
        we can avoid it for now. */
      const scope = this.visit(args[1]);

      if (args[1].type !== this.Types._object) {
        throw new SemanticTypeError({
          message: 'Code requires scope to be an object'
        });
      }

      return `Code(${code}, ${scope})`;
    }

    return `Code(${code})`;
  }

  /**
   * TODO: Could move this to javascript/Visitor and use template.
   *
   * child nodes: arguments
   * grandchild nodes: argumentList?
   * great-grandchild nodes: singleExpression+
   *
   * @param {FuncCallExpressionContext} ctx
   * @return {String}
   */
  emitObjectId(ctx) {
    ctx.type = this.Types.ObjectId;

    const argList = ctx.arguments().argumentList();

    if (!argList) {
      return 'ObjectId()';
    }

    let hexstr;

    try {
      hexstr = this.executeJavascript(ctx.getText()).toHexString();
    } catch (error) {
      throw new SemanticGenericError({message: error.message});
    }

    return `ObjectId(${singleQuoteStringify(hexstr)})`;
  }

  /**
   * TODO: Maybe move this to javascript/Visitor and use template?
   *
   * child nodes: arguments
   * grandchild nodes: argumentList?
   * great-grandchild nodes: singleExpression+
   *
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

    const bytes = singleQuoteStringify(binobj.toString());
    const argList = ctx.arguments().argumentList().singleExpression();

    if (argList.length === 1) {
      return `Binary(b${bytes})`;
    }

    return `Binary(b${bytes}, ${this.binarySubTypes[type]})`;
  }

  /**
   * TODO: Maybe move this to javascript/Visitor and use template?
   *
   * child nodes: arguments
   * grandchild nodes: argumentList?
   * great-grandchild nodes: singleExpression+
   *
   * @param {FuncCallExpressionContext} ctx
   * @return {String}
   */
  emitLong(ctx) {
    ctx.type = this.Types.Long;

    let longstr;

    try {
      longstr = this.executeJavascript(ctx.getText()).toString();
    } catch (error) {
      throw new SemanticGenericError({message: error.message});
    }

    return `Int64(${longstr})`;
  }

  /**
   * TODO: Could move this to javascript/Visitor and use template.
   *
   * @param {FuncCallExpressionContext} ctx
   * @return {String}
   */
  emitDecimal128(ctx) {
    ctx.type = this.Types.Decimal128;

    let decimal;

    try {
      decimal = this.executeJavascript(`new ${ctx.getText()}`);
    } catch (error) {
      throw new SemanticGenericError({message: error.message});
    }

    const str = singleQuoteStringify(decimal.toString());

    return `Decimal128(${str})`;
  }

  /* ************** Object methods **************** */

  /**
   * LongfromBits method
   *
   * @param {FuncCallExpressionContext} ctx
   * @return {String}
   */
  emitLongfromBits(ctx) {
    return this.emitLong(ctx);
  }

  /**
   * LongtoString method
   *
   * @param {FuncCallExpressionContext} ctx
   * @return {String}
   */
  emitLongtoString(ctx) {
    ctx.type = this.Types._string;

    const long = ctx.singleExpression().singleExpression();
    let longstr;

    try {
      longstr = this.executeJavascript(long.getText()).toString();
    } catch (error) {
      throw new SemanticGenericError({message: error.message});
    }

    return `str(Int64(${longstr}))`;
  }
};
