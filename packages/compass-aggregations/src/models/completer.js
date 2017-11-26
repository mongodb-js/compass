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
   * @param {Session} session - The current editor session.
   * @param {Number} position - The cursor position.
   * @param {String} prefix - The string prefix to complete.
   * @param {Function} done - The done callback.
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
