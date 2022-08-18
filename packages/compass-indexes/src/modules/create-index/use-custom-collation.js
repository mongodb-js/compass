/**
 * Change use custom collation action name.
 */
export const TOGGLE_USE_CUSTOM_COLLATION =
  'indexes/create-index/use-custom-collation/TOGGLE_USE_CUSTOM_COLLATION';

/**
 * The initial state of the use custom collation attribute.
 */
export const INITIAL_STATE = false;

/**
 * Reducer function for handle state changes to use custom collation.
 *
 * @param {Boolean} state - The use custom collation state.
 * @param {Object} action - The action.
 *
 * @returns {Array} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === TOGGLE_USE_CUSTOM_COLLATION) {
    return action.useCustomCollation;
  }
  return state;
}

/**
 * The toggle use custom collation action creator.
 *
 * @param {Boolean} useCustomCollation - Is a custom collation.
 *
 * @returns {Object} The action.
 */
export const toggleUseCustomCollation = (useCustomCollation) => ({
  type: TOGGLE_USE_CUSTOM_COLLATION,
  useCustomCollation: useCustomCollation,
});
