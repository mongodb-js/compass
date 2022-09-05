import type { AnyAction } from 'redux';

/**
 * Change schema fields action name.
 */
export const CHANGE_SCHEMA_FIELDS =
  'indexes/create-index/schema-fields/CHANGE_SCHEMA_FIELDS';

/**
 * The initial state of the schema fields.
 */
export const INITIAL_STATE: string[] = [];

/**
 * Reducer function for handle the schema fields state changes.
 *
 * @param state - The create schema fields state.
 * @param action - The action.
 *
 * @returns The new state.
 */
export default function reducer(
  state = INITIAL_STATE,
  action: AnyAction
): string[] {
  if (action.type === CHANGE_SCHEMA_FIELDS) {
    return action.schemaFields;
  }
  return state;
}

/**
 * The change schema fields action creator.
 *
 * @param schemaFields - The schema fields.
 *
 * @returns The action.
 */
export const changeSchemaFields = (schemaFields: string[]) => ({
  type: CHANGE_SCHEMA_FIELDS,
  schemaFields,
});
