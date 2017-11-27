import STAGE_OPERATORS from 'constants/stage-operators';
// import EXPRESSION_OPERATORS from 'constants/expression-operators';
// import ACCUMULATORS from 'constants/accumulators';

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
   * $lookup: token.type == 'identifier', token.value == $lookup
   * '$lookup': token.type == 'string', token.value == '$lookup'
   * "$lookup": token.type == 'string', token.value == "$lookup"
   */
  getCompletions(editor, session, position, prefix, done) {
    // console.log(session.getTokens(position.row));
    done(null, this._filter(prefix));
  }

  // 1. Get all previous non-empty string tokens or identifier tokens as trimmed.
  // 2. If none exist, suggest stage operators.
  // 3. If some exist:
  //    a) If first token is a stage operator but not $group or $project:
  //       i. ) Suggest expression operators.
  //    b) If first token is $group or $project.
  //       1. ) Suggest expressions operators + appropriate accumulators.

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
