import type { RootAction } from '.';

/**
 * Fields changed action.
 */
export const FIELDS_CHANGED = 'aggregations/fields/FIELDS_CHANGED' as const;
interface FieldsChangedAction {
  type: typeof FIELDS_CHANGED;
  fields: { name: string }[];
}
export type FieldsAction = FieldsChangedAction;
export type FieldsState = { name: string }[];

/**
 * The initial state.
 */
export const INITIAL_STATE: FieldsState = [];

/**
 * Reducer function for handle state changes to fields.
 */
export default function reducer(
  state: FieldsState = INITIAL_STATE,
  action: RootAction
): FieldsState {
  if (action.type === FIELDS_CHANGED) {
    return action.fields;
  }
  return state;
}

/**
 * Action creator for fields changed events.
 */
export const fieldsChanged = (
  fields: { name: string }[]
): FieldsChangedAction => ({
  type: FIELDS_CHANGED,
  fields: fields,
});
