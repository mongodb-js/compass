/**
 * The module action prefix.
 */
const PREFIX = 'home';

/**
 * The isAtlas action type.
 */
export const TOGGLE_IS_ATLAS = `${PREFIX}/is-atlas/TOGGLE_IS_ATLAS`;

/**
 * The initial state.
 */
export const INITIAL_STATE = false;

/**
 * Reducer function for handle state changes to isAtlas.
 *
 * @param {Boolean} state - The status state.
 * @param {Object} action - The action.
 *
 * @returns {Boolean} The new state.
 */
const reducer = (state = INITIAL_STATE, action) => {
  if (action.type === TOGGLE_IS_ATLAS) {
    return action.isAtlas;
  }
  return state;
};

export default reducer;

/**
 * Action creator for isAtlas events.
 *
 * @param {Boolean} isAtlas
 * @returns {Object} The isAtlas action.
 */
export const toggleIsAtlas = (isAtlas) => ({
  type: TOGGLE_IS_ATLAS,
  isAtlas: isAtlas
});
