import type { AnyAction } from 'redux';

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
 * @param state - The create schema fields state.
 * @param action - The action.
 *
 * @returns The new state.
 */
export default function reducer(state = INITIAL_STATE, action: AnyAction) {
  if (action.type === CHANGE_SCHEMA_FIELDS) {
    return action.schemaFields;
  }
  return state;
}

/**
 * The change name action creator.
 *
 * @param schemaFields - The schema fields.
 *
 * @returns The action.
 */
export const changeSchemaFields = (schemaFields: string[]) => ({
  type: CHANGE_SCHEMA_FIELDS,
  schemaFields,
});
