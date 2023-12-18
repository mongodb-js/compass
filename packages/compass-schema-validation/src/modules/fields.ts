import type { RootAction } from '.';

/**
 * Fields changed action.
 */
export const FIELDS_CHANGED = 'validation/fields/FIELDS_CHANGED' as const;
interface FieldsChangedAction {
  type: typeof FIELDS_CHANGED;
  fields: Record<string, unknown>;
}

export type FieldsAction = FieldsChangedAction;

export type FieldsState = {
  name: string;
  value: string;
  score: number;
  meta: string;
  version: string;
}[];

/**
 * The initial state.
 */
export const INITIAL_STATE: FieldsState = [];

/**
 * Process the fields into an autocomplete friendly format.
 */
const process = (fields: Record<string, unknown>) =>
  Object.keys(fields).map((key) => {
    const field =
      key.indexOf('.') > -1 || key.indexOf(' ') > -1 ? `"${key}"` : key;

    return {
      name: key,
      value: field,
      score: 1,
      meta: 'field',
      version: '0.0.0',
    };
  });

/**
 * Reducer function for handle state changes to fields.
 */
export default function reducer(
  state: FieldsState = INITIAL_STATE,
  action: RootAction
) {
  if (action.type === FIELDS_CHANGED) {
    return process(action.fields);
  }

  return state;
}

/**
 * Action creator for fields changed events.
 */
export const fieldsChanged = (
  fields: Record<string, unknown>
): FieldsChangedAction => ({
  type: FIELDS_CHANGED,
  fields,
});
