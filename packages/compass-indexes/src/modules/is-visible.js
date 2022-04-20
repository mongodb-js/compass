/**
 * The prefix.
 */
const PREFIX = 'indexes/is-visible';

/**
 * Toggle is visible.
 */
export const TOGGLE_IS_VISIBLE = `${PREFIX}/TOGGLE_IS_VISIBLE`;

/**
 * The initial state of the is visible attribute.
 */
export const INITIAL_STATE = false;

/**
 * Reducer function for handle state changes to is visible.
 *
 * @param {Boolean} state - The is visible state.
 * @param {Object} action - The action.
 *
 * @returns {Boolean} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === TOGGLE_IS_VISIBLE) {
    return action.isVisible;
  }
  return state;
}

/**
 * The toggle is visible action creator.
 *
 * @param {Boolean} isVisible - Is visible.
 *
 * @returns {Object} The action.
 */
export const toggleIsVisible = (isVisible) => ({
  type: TOGGLE_IS_VISIBLE,
  isVisible: isVisible,
});
