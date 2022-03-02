/**
 * Collation collapser action.
 */
export const COLLATION_COLLAPSE_TOGGLED = 'aggregations/collation/COLLATION_COLLAPSE_TOGGLED';

/**
 * The collation collapser initial state.
 */
export const INITIAL_STATE = false;

/**
 * Reducer function for handle collation collapser state changes.
 *
 * @param {Boolean} state - The collation collapser state.
 * @param {Object} action - The action.
 *
 * @returns {Boolean} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === COLLATION_COLLAPSE_TOGGLED) {
    return !state;
  }
  return state;
}

/**
 * Action creator for collation event.
 *
 * @returns {Object} The collation changed action.
 */
export const collationCollapseToggled = () => {
  return {type: COLLATION_COLLAPSE_TOGGLED};
};
