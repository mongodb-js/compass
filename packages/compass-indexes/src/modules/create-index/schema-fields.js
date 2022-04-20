/**
 * Change schema fields.
 */
export const CHANGE_SCHEMA_FIELDS =
  'indexes/create-index/name/CHANGE_SCHEMA_FIELDS';

/**
 * The initial state of the schema fields.
 */
export const INITIAL_STATE = [];

/**
 * Reducer function for handle state changes to create schema fields.
 *
 * @param {String} state - The create schema fields state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === CHANGE_SCHEMA_FIELDS) {
    return action.schemaFields;
  }
  return state;
}

/**
 * The change name action creator.
 *
 * @param {Array} schemaFields - The schema fields.
 *
 * @returns {Object} The action.
 */
export const changeSchemaFields = (schemaFields) => ({
  type: CHANGE_SCHEMA_FIELDS,
  schemaFields: schemaFields,
});
