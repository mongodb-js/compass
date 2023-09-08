import type { AnyAction, Dispatch } from 'redux';

import { handleError } from './error';

import type { RootState } from '../create-index';
import { RESET_FORM } from '../reset-form';

export const ADD_FIELD = 'indexes/create-index/fields/ADD_FIELD';
export const UPDATE_FIELD_TYPE =
  'indexes/create-index/fields/UPDATE_FIELD_TYPE';
export const REMOVE_FIELD = 'indexes/create-index/fields/REMOVE_FIELD';
export const CHANGE_FIELDS = 'indexes/create-index/fields/CHANGE_FIELDS';

export type IndexField = { name: string; type: string };

/**
 * The initial state of the fields.
 */
export const INITIAL_STATE = [{ name: '', type: '' }];

/**
 * Reducer function for handle the fields state changes.
 *
 * @param state - The fields state.
 * @param action - The action.
 *
 * @returns The new state.
 */
export default function reducer(
  state = INITIAL_STATE,
  action: AnyAction
): IndexField[] {
  const fields = [...state];
  if (action.type === ADD_FIELD) {
    fields.push({ name: '', type: '' });
    return fields;
  }
  if (action.type === REMOVE_FIELD) {
    fields.splice(action.idx, 1);
    return fields;
  }
  if (action.type === UPDATE_FIELD_TYPE) {
    if (action.idx >= 0 && action.idx < fields.length) {
      const field = { ...fields[action.idx] };
      field.type = action.fType;
      fields[action.idx] = field;
    }
    return fields;
  }
  if (action.type === CHANGE_FIELDS) {
    return action.fields;
  }
  if (action.type === RESET_FORM) {
    return INITIAL_STATE;
  }
  return state;
}

export const addField = () => ({
  type: ADD_FIELD,
});

export const removeField = (idx: number) => ({
  type: REMOVE_FIELD,
  idx,
});

export const updateFieldType = (idx: number, fType: string) => ({
  type: UPDATE_FIELD_TYPE,
  idx: idx,
  fType,
});

export const changeFields = (fields: IndexField[]) => ({
  type: CHANGE_FIELDS,
  fields: fields,
});

export const updateFieldName = (idx: number, name: string) => {
  return (dispatch: Dispatch, getState: () => RootState) => {
    const state = getState();
    const fields: IndexField[] = [...state.fields];
    if (idx >= 0 && idx < state.fields.length) {
      // Check if field name exists.
      if (
        state.fields.some(
          (field: IndexField, eIdx: number) =>
            field.name === name && eIdx !== idx
        )
      ) {
        dispatch(handleError('Index keys must be unique'));
        return;
      }
      const field = { ...fields[idx] };
      field.name = name;
      fields[idx] = field;
      dispatch(changeFields(fields));
    }
  };
};
