
/* eslint complexity: 0 */
const path = require('path');

const {
  singleQuoteStringify,
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
   * Special cased because different target languages need different info out
   * of the constructed date.
   *
   * child nodes: arguments
   * grandchild nodes: argumentList?
   * great-grandchild nodes: singleExpression+
   *
   * @param {FuncCallExpressionContext} ctx
   * @param {Date} date
   * @return {String}
   */
  emitDate(ctx, date) {
    ctx.type = this.Types.Date;
    let toStr = '';
    if (!ctx.wasNew && this.visit(ctx.singleExpression()) !== 'ISODate') {
      ctx.type = this.Types._string;
      toStr = '.strftime(\'%a %b %d %Y %H:%M:%S %Z\')';
    }

    if (date === undefined) {
      return `datetime.datetime.utcnow().date()${toStr}`;
    }
    const dateStr = [
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds()
    ].join(', ');

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
    ctx.type = this.Types.BSONRegExp;
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
};
