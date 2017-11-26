import STAGE_OPERATORS from 'constants/stage-operators';

/**
 * Adds autocomplete suggestions based on the aggregation pipeline
 * operators.
 */
class Completer {

  /**
   * Instantiate a new completer with the current server version.
   *
   * @param {String} version - The version.
   */
  constructor(version) {
    this.version = version;
  }

  /**
   * Get the completion list for the provided params.
   *
   * @param {Editor} editor - The ACE editor.
   * @param {EditSession} session - The current editor session.
   * @param {Position} position - The cursor position.
   * @param {String} prefix - The string prefix to complete.
   * @param {Function} done - The done callback.
   *
   * @note When keys are "$lookup" then treated as type "variable" and token
   *   has the quotes. When keys are $lookup then treated as type "text" with no
   *   quotes. Should we extend json mode?
   */
  getCompletions(editor, session, position, prefix, done) {
    // session.getTokens(row) -> [];
    // session.getLines(firstRow, lastRow) -> [];
    //   line.type ('paren.lparen'/'text')
    //   line.value
    // position.row -> Number
    // position.column -> Number
    done(null, this._filter(prefix));
  }

  /**
   * Filter the operators based on the prefix.
   *
   * @param {String} prefix - The prefix.
   *
   * @returns {Array} The matching operators.
   */
  _filter(prefix) {
    return STAGE_OPERATORS.filter((op) => {
      return op.name.startsWith(prefix);
    });
  }
}

export default Completer;
export { Completer };
