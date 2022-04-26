/**
 * Change is columnar action name.
 */
export const TOGGLE_IS_COLUMNAR =
  'indexes/create-indexes/is-columnar/TOGGLE_IS_COLUMNAR';

type IsColumnarState = boolean;

/**
 * The initial state of the is writable attribute.
 */
export const INITIAL_STATE: IsColumnarState = false;

type IsColumnarAction = {
  type: typeof TOGGLE_IS_COLUMNAR;
  isColumnar: boolean;
};

/**
 * Reducer function for handle state changes to is columnar.
 *
 * @param {Boolean} state - The is columnar state.
 * @param {Object} action - The action.
 *
 * @returns {Array} The new state.
 */
export default function reducer(
  state = INITIAL_STATE,
  action: IsColumnarAction
): IsColumnarState {
  if (action.type === TOGGLE_IS_COLUMNAR) {
    return action.isColumnar;
  }
  return state;
}

/**
 * The toggle is columnar action creator.
 *
 * @param {Boolean} isColumnar - Is columnar.
 *
 * @returns {Object} The action.
 */
export const toggleIsColumnar = (
  isColumnar: IsColumnarState
): IsColumnarAction => ({
  type: TOGGLE_IS_COLUMNAR,
  isColumnar: isColumnar,
});
