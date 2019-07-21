/**
 * The prefix.
 */
const PREFIX = 'sidebar/is-genuine-mongodb-visible';

/**
 * Toggle is visible.
 */
export const TOGGLE_IS_GENUINE_MONGODB_VISIBLE = `${PREFIX}/TOGGLE_IS_GENUINE_MONGODB_VISIBLE`;

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
  if (action.type === TOGGLE_IS_GENUINE_MONGODB_VISIBLE) {
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
export const toggleIsGenuineMongoDBVisible = (isVisible) => ({
  type: TOGGLE_IS_GENUINE_MONGODB_VISIBLE,
  isVisible: isVisible
});
