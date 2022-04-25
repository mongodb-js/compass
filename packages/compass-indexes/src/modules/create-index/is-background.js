/**
 * Change is background action name.
 */
export const TOGGLE_IS_BACKGROUND =
  'indexes/create-indexes/is-background/TOGGLE_IS_BACKGROUND';

/**
 * The initial state of the is writable attribute.
 */
export const INITIAL_STATE = false;

/**
 * Reducer function for handle state changes to is background.
 *
 * @param {Boolean} state - The is background state.
 * @param {Object} action - The action.
 *
 * @returns {Array} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === TOGGLE_IS_BACKGROUND) {
    return action.isBackground;
  }
  return state;
}

/**
 * The toggle is background action creator.
 *
 * @param {Boolean} isBackground - Is background.
 *
 * @returns {Object} The action.
 */
export const toggleIsBackground = (isBackground) => ({
  type: TOGGLE_IS_BACKGROUND,
  isBackground: isBackground,
});
