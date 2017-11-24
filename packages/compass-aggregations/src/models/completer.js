import STAGE_OPERATORS from 'constants/stage-operators';

/**
 * Adds autocomplete suggestions based on the aggregation pipeline
 * operators.
 */
class Completer {

  /**
   * Get the completion list for the provided params.
   */
  getCompletions(editor, session, position, prefix, done) {
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
