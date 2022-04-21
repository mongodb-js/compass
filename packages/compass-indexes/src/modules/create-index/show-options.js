/**
 * Change show options action name.
 */
export const TOGGLE_SHOW_OPTIONS =
  'indexes/create-indexes/show-options/TOGGLE_SHOW_OPTIONS';

/**
 * The initial state of the is writable attribute.
 */
export const INITIAL_STATE = false;

/**
 * Reducer function for handle state changes to show options.
 *
 * @param {Boolean} state - The show options state.
 * @param {Object} action - The action.
 *
 * @returns {Array} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === TOGGLE_SHOW_OPTIONS) {
    return action.showOptions;
  }
  return state;
}

/**
 * The toggle show options action creator.
 *
 * @param {Boolean} showOptions - Show options.
 *
 * @returns {Object} The action.
 */
export const toggleShowOptions = (showOptions) => ({
  type: TOGGLE_SHOW_OPTIONS,
  showOptions: showOptions,
});
