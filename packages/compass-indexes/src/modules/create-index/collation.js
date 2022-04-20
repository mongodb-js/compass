/**
 * Change collation option action name.
 */
export const CHANGE_COLLATION_OPTION =
  'indexes/create-index/collation/CHANGE_COLLATION_OPTION';

/**
 * The initial state of the collation.
 */
export const INITIAL_STATE = {};

/**
 * Reducer function for handle state changes to collation.
 *
 * @param {Array} state - The collation state.
 * @param {Object} action - The action.
 *
 * @returns {Array} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === CHANGE_COLLATION_OPTION) {
    return { ...state, [action.field]: action.value };
  }
  return state;
}

/**
 * The change capped size action creator.
 *
 * @param {String} field - The collation option.
 * @param {String} value - The collation option value.
 *
 * @returns {Object} The action.
 */
export const changeCollationOption = (field, value) => ({
  type: CHANGE_COLLATION_OPTION,
  field: field,
  value: value,
});
