import STAGE_OPERATORS from 'constants/stage-operators';

/**
 * Adds autocomplete suggestions based on the aggregation pipeline
 * operators.
 */
class Completer {

  /**
   * Get the completion list for the provided params.
   */
  getCompletions(editor, session, pos, prefix, callback) {
    callback(null, this._filter(prefix));
  }

  /**
   * Since we keep the list of operators sorted, we can break the loop
   * at the first non-match.
   *
   * @param {String} prefix - The prefix.
   *
   * @returns {Array} The matching operators.
   */
  _filter(prefix) {
    const operators = [];
    for (const operator of STAGE_OPERATORS) {
      if (operator.name.startsWith(prefix)) {
        operators.push(operator);
      } else {
        break;
      }
    }
    return operators;
  }
}

export default Completer;
export { Completer };
