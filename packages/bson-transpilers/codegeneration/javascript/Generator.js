/*
 * Class for handling edge cases for node code generation. Defines "emit" methods.
 */
module.exports = (Visitor) => class Generator extends Visitor {
  constructor() {
    super();
  }

  generateFuncDefExpression(ctx) {
    const source = ctx.start.source[1].strdata;
    const startIndex = ctx.start.start;
    const stopIndex = ctx.stop.stop;
    return source.slice(startIndex, stopIndex + 1);
  }
};
