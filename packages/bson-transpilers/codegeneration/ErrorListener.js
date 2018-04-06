const antlr4 = require('antlr4');
const path = require('path');

const {SyntaxGenericError} = require(path.resolve('helper', 'error'));

/**
 * Custom Error Listener
 *
 * @returns {object}
 */
class ErrorListener extends antlr4.error.ErrorListener {
  /**
   * Checks syntax error
   *
   * @param {object} recognizer The parsing support code essentially. Most of it is error recovery stuff
   * @param {object} symbol Offending symbol
   * @param {int} line Line of offending symbol
   * @param {int} column Position in line of offending symbol
   * @param {string} message Error message
   * @param {string} payload Stack trace
   */
  syntaxError(recognizer, symbol, line, column, message) {
    throw new SyntaxGenericError({line, column, message});
  }
}

module.exports = ErrorListener;
