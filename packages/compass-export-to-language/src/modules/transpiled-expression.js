/**
 * The prefix.
 */
const PREFIX = 'export-to-language/transpiled-expression';

/**
 * TranspiledExpression changed action.
 */
export const TRANSPILED_EXPRESSION_CHANGED = `${PREFIX}/TRANSPILED_EXPRESSION_CHANGED`;

/**
 * The initial state.
 */
export const INITIAL_STATE = '';

/**
 * Reducer function for handle state changes to transpiledExpression.
 *
 * @param {String} state - The transpiledExpression state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === TRANSPILED_EXPRESSION_CHANGED) {
    return action.transpiledExpression;
  }

  return state;
}

/**
 * Action creator for transpiledExpression changed events.
 *
 * @param {String} transpiledExpression - The transpiledExpression value.
 *
 * @returns {Object} The transpiledExpression changed action.
 */
export const transpiledExpressionChanged = (transpiledExpression) => ({
  type: TRANSPILED_EXPRESSION_CHANGED,
  transpiledExpression,
});
