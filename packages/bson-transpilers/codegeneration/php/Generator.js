/*
 * Class for handling edge cases for php code generation. Defines "emit" methods.
 */
const PHPUtils = require('./PHPUtils');
module.exports = (Visitor) => class Generator extends Visitor {
  constructor() {
    super();

    // Common functions used by templates
    this.state.utils = new PHPUtils();
  }
};
