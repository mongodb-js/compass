/* eslint complexity: 0 */
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
    this.bsonRegexFlags = {
      i: 'i', // Case insensitivity to match
      m: 'm', // Multiline match
      x: 'x', // Ignore all white space characters
      s: 's', // Matches all
      l: 'l', // Case-insensitive matching dependent on the current locale?
      u: 'u' // Unicode?
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

    if (!ctx.wasNew && !ctx.getText().includes('ISODate')) {
      ctx.type = this.Types._string;
      toStr = '.strftime(\'%a %b %d %Y %H:%M:%S %Z\')';
    }

    if (date === undefined) {
      return `datetime.datetime.utcnow()${toStr}`;
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
   * Accepts date or number, if date then don't convert to date.
   *
   * @param {FuncCallExpressionContext} ctx
   * @return {String}
   */
  emitObjectIdCreateFromTime(ctx) {
    ctx.type = 'createFromTime' in this.Symbols.ObjectId.attr ?
      this.Symbols.ObjectId.attr.createFromTime :
      this.Symbols.ObjectId.attr.fromDate;
    const argList = ctx.arguments().argumentList();
    const args = this.checkArguments(ctx.type.args, argList);
    const template = ctx.type.template ? ctx.type.template() : '';
    if (argList.singleExpression()[0].type.id === 'Date') {
      return `${template}${ctx.type.argsTemplate('', args[0])}`;
    }
    return `${template}${ctx.type.argsTemplate(
      '', `datetime.datetime.fromtimestamp(${args[0]} / 1000)`)}`;
  }
};
