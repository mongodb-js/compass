import { STAGE_OPERATORS, STAGE_OPERATOR_NAMES } from 'constants/stage-operators';
import EXPRESSION_OPERATORS from 'constants/expression-operators';
import semver from 'semver';
// import ACCUMULATORS from 'constants/accumulators';

/**
 * The type of token for operators in js mode.
 */
const IDENTIFIER = 'identifier';

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
  constructor(version = '3.4.0') {
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
    const identifiers = this.getIdentifiers(session, position);
    if (this.needsStageOperator(identifiers)) {
      done(null, this._filter(STAGE_OPERATORS, prefix));
    } else {
      done(null, this._filter(EXPRESSION_OPERATORS, prefix));
    }
  }

  /**
   * Get all identifier tokens for the current row.
   *
   * @param {EditSession} session - The edit session.
   * @param {Position} position - The current position.
   *
   * @returns {Array} The identifiers.
   */
  getIdentifiers(session, position) {
    return session.getTokens(position.row).filter((token) => {
      return token.type === IDENTIFIER;
    });
  }

  /**
   * Determine if a stage operator is needed by checking if the
   * existing identifiers already contains one.
   *
   * @param {Array} identifiers - The existing identifiers.
   *
   * @returns {Boolean} If a stage operator is needed.
   */
  needsStageOperator(identifiers) {
    if (identifiers.length === 0) return true;
    return !identifiers.some((i) => {
      return STAGE_OPERATOR_NAMES.includes(i.value);
    });
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
