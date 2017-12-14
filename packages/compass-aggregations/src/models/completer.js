import EXPRESSION_OPERATORS from 'constants/expression-operators';
import ACCUMULATORS from 'constants/accumulators';
import semver from 'semver';
import store from 'stores';

/**
 * String token type.
 */
const STRING = 'string';

/**
 * The proect stage operator.
 */
const PROJECT = '$project';

/**
 * The group stage operator.
 */
const GROUP = '$group';

/**
 * Adds autocomplete suggestions based on the aggregation pipeline
 * operators.
 */
class Completer {

  /**
   * Get accumulator completions based on the stage identifier.
   *
   * @returns {Array} The accumulators.
   */
  accumulators() {
    const stage = store.getState().stages[this.index];
    if (stage) {
      const stageOperator = stage.stageOperator;
      if (stageOperator) {
        if (stageOperator === PROJECT) {
          return ACCUMULATORS.filter((acc) => {
            return acc.projectVersion &&
              semver.gte(this.version, acc.projectVersion);
          });
        } else if (stageOperator === GROUP) {
          return ACCUMULATORS;
        }
      }
    }
    return [];
  }

  /**
   * Instantiate a new completer with the current server version.
   *
   * @param {String} version - The version.
   * @param {TextCompleter} textCompleter - The fallback Ace text completer.
   * @param {Number} index - The stage index.
   */
  constructor(version, textCompleter, index) {
    this.version = version;
    this.textCompleter = textCompleter;
    this.index = index;
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
   * @returns {Function} The completion function.
   */
  getCompletions(editor, session, position, prefix, done) {
    // Empty prefixes do not return results.
    if (prefix === '') return done(null, []);
    // If the current token is a string with single or double quotes, then
    // we want to use the local text completer instead of suggesting operators.
    // This is so we can suggest user variable names inside the pipeline that they
    // have already typed.
    const currentToken = session.getTokenAt(position.row, position.column);
    if (currentToken.type === STRING) {
      return this.textCompleter.getCompletions(editor, session, position, prefix, done);
    }
    // If the current token is not a string, then we proceed as normal to suggest
    // operators to the user.
    const expressions = EXPRESSION_OPERATORS.concat(this.accumulators());
    done(null, this._filter(expressions, prefix));
  }

  /**
   * Filter the operators based on the prefix.
   *
   * @param {Array} operators - The operators to filter.
   * @param {String} prefix - The prefix.
   *
   * @returns {Array} The matching operators.
   */
  _filter(operators, prefix) {
    return operators.filter((op) => {
      return op.name.startsWith(prefix) &&
        semver.gte(this.version, op.version);
    });
  }
}

export default Completer;
export { Completer };
