/*
 * Class for handling edge cases for node code generation. Defines "emit" methods.
 */
module.exports = (Visitor) => class Generator extends Visitor {
  constructor() {
    super();
  }

  generateFuncDefExpression(ctx) {
    return ctx.getText();
  }
};
