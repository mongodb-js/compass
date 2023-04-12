import type { AnyAction } from 'redux';

type Field = {
  name: string;
};

/**
 * Fields changed action.
 */
export const FIELDS_CHANGED = 'aggregations/fields/FIELDS_CHANGED';

/**
 * The initial state.
 */
export const INITIAL_STATE: Field[] = [];

export default function reducer(
  state = INITIAL_STATE,
  action: AnyAction
): Field[] {
  if (action.type === FIELDS_CHANGED) {
    return action.fields;
  }
  return state;
}

/**
 * Action creator for fields changed events.
 */
export const fieldsChanged = (fields: { name: string }[]) => ({
  type: FIELDS_CHANGED,
  fields: fields,
});
