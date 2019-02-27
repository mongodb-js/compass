import { RESET } from 'modules/reset';

/**
 * Create fields.
 */
export const CHANGE_FIELDS = 'field-store/CHANGE_FIELDS';

/**
 * The initial state of the fields.
 */
export const INITIAL_STATE = {
  fields: {},
  topLevelFields: [],
  aceFields: []
};

/**
 * Reducer function for handle state changes to fields.
 *
 * @param {Object} state - The fields state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const reducer = (state = INITIAL_STATE, action) => {
  if (action.type === CHANGE_FIELDS) {
    return {
      fields: action.fields,
      topLevelFields: action.topLevelFields,
      aceFields: action.aceFields
    };
  }
  if (action.type === RESET) {
    return INITIAL_STATE;
  }
  return state;
};

/**
 * The change fields action creator.
 *
 * @param {Object} fields - The fields.
 * @param {Object} topLevelFields - The top level fields.
 * @param {Object} aceFields - The ace fields.
 *
 * @returns {Object} The action.
 */
export const changeFields = (fields, topLevelFields, aceFields) => ({
  type: CHANGE_FIELDS,
  fields: fields,
  topLevelFields: topLevelFields,
  aceFields: aceFields
});

export default reducer;
