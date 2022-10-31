/**
 * The prefix.
 */
const PREFIX = 'export-to-language/input-expression';

/**
 * InputExpression changed action.
 */
export const INPUT_EXPRESSION_CHANGED = `${PREFIX}/INPUT_EXPRESSION_CHANGED`;

/**
 * The initial state.
 */
export const INITIAL_STATE = { filter: '' };

/**
 * Reducer function for handle state changes to inputExpression.
 *
 * @param {String} state - The inputExpression state.
 * @param {Object} action - The action.
 *
 * @inputs {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === INPUT_EXPRESSION_CHANGED) {
    return action.inputExpression;
  }

  return state;
}

/**
 * Action creator for inputExpression changed events.
 *
 * @param {String} inputExpression - The inputExpression value.
 *
 * @inputs {Object} The inputExpression changed action.
 */
export const inputExpressionChanged = (inputExpression) => ({
  type: INPUT_EXPRESSION_CHANGED,
  inputExpression,
});
