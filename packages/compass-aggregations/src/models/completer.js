import { STAGE_OPERATORS, STAGE_OPERATOR_NAMES } from 'constants/stage-operators';
import EXPRESSION_OPERATORS from 'constants/expression-operators';
import ACCUMULATORS from 'constants/accumulators';
import semver from 'semver';

/**
 * The type of token for operators in js mode.
 */
const IDENTIFIER = 'identifier';

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
   * @param {Array} identifiers - The identifiers.
   *
   * @returns {Array} The accumulators.
   */
  accumulators(identifiers) {
    if (identifiers[0].value === PROJECT) {
      return ACCUMULATORS.filter((acc) => {
        return acc.projectVersion &&
          semver.gte(this.version, acc.projectVersion);
      });
    } else if (identifiers[0].value === GROUP) {
      return ACCUMULATORS;
    }
    return [];
  }

  /**
   * Add more tokens to the provided token list for the new row.
   *
   * @param {EditSession} session - The edit session.
   * @param {Number} row - The row.
   * @param {Array} tokens - The tokens to concat to.
   *
   * @returns {Array} The new token array.
   */
  addTokens(session, row, tokens) {
    return session.getTokens(row).filter((token) => {
      return token.type === IDENTIFIER;
    }).concat(tokens);
  }

  /**
   * Instantiate a new completer with the current server version.
   *
   * @param {String} version - The version.
   * @param {TextCompleter} textCompleter - The fallback Ace text completer.
   */
  constructor(version, textCompleter) {
    this.version = version;
    this.textCompleter = textCompleter;
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
    const identifiers = this.identifiers(session, position.row);
    if (this.isStageOperatorAbsent(identifiers)) {
      done(null, this._filter(STAGE_OPERATORS, prefix));
    } else {
      const expressions = EXPRESSION_OPERATORS.concat(this.accumulators(identifiers));
      done(null, this._filter(expressions, prefix));
    }
  }

  /**
   * Recursively get all identifier tokens from the current row to
   * the beginning.
   *
   * @param {EditSession} session - The edit session.
   * @param {Number} row - The current row.
   * @param {Array} tokens - The previous tokens.
   *
   * @returns {Array} The identifiers.
   */
  identifiers(session, row, tokens = []) {
    if (row <= 0) {
      return this.addTokens(session, row, tokens);
    }
    return this.identifiers(session, row - 1, this.addTokens(session, row, tokens));
  }

  /**
   * Determine if a stage operator is needed by checking if the
   * existing identifiers already contains one.
   *
   * @param {Array} identifiers - The existing identifiers.
   *
   * @returns {Boolean} If a stage operator is needed.
   */
  isStageOperatorAbsent(identifiers) {
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
