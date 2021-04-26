/**
 * Fields changed action.
 */
export const FIELDS_CHANGED = 'validation/fields/FIELDS_CHANGED';

/**
 * The initial state.
 */
export const INITIAL_STATE = [];

/**
 * Process the fields into an autocomplete friendly format.
 *
 * @param {Object} fields - The fields.
 *
 * @returns {Array} The processed fields.
 */
const process = (fields) => Object.keys(fields).map((key) => {
  const field = (key.indexOf('.') > -1 || key.indexOf(' ') > -1) ? `"${key}"` : key;

  return {
    name: key,
    value: field,
    score: 1,
    meta: 'field',
    version: '0.0.0'
  };
});

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
    return process(action.fields);
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
  fields
});
