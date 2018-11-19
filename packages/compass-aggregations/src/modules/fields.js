/**
 * Fields changed action.
 */
export const FIELDS_CHANGED = 'aggregations/fields/FIELDS_CHANGED';

/**
 * The initial state.
 */
export const INITIAL_STATE = [];

/**
 * Reducer function for handle state changes to fields.
 *
 * @param {Array} state - The fields state.
 * @param {Object} action - The action.
 *
 * @returns {Array} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === FIELDS_CHANGED) {
    return action.fields;
  }
  return state;
}

/**
 * Action creator for fields changed events.
 *
 * @param {Object} fields - The fields value.
 *
 * @returns {Object} The fields changed action.
 */
export const fieldsChanged = (fields) => ({
  type: FIELDS_CHANGED,
  fields: fields
});
