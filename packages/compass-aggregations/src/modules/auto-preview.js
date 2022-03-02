/**
 * Auto Preview toggled action name.
 */
export const TOGGLE_AUTO_PREVIEW = 'aggregations/autoPreview/TOGGLE_AUTO_PREVIEW';

/**
 * The initial state.
 */
export const INITIAL_STATE = true;

/**
 * Reducer function for handle state changes to autoPreview.
 *
 * @param {Boolean} state - The auto preview state.
 * @param {Object} action - The action.
 *
 * @returns {Boolean} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === TOGGLE_AUTO_PREVIEW) {
    return !state;
  }
  return state;
}

/**
 * Action creator for autoPreview toggling.
 *
 * @returns {Object} The toggle autoPreview action.
 */
export const toggleAutoPreview = () => ({
  type: TOGGLE_AUTO_PREVIEW
});
