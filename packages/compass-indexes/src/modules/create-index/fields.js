import contains from 'lodash.contains';
import { changeSchemaFields } from '../create-index/schema-fields';
import { handleError } from '../error';

/**
 * Create field names.
 */
export const ADD_FIELD = 'indexes/create-index/fields/ADD_FIELD';
export const UPDATE_FIELD_TYPE =
  'indexes/create-index/fields/UPDATE_FIELD_TYPE';
export const REMOVE_FIELD = 'indexes/create-index/fields/REMOVE_FIELD';
export const CHANGE_FIELDS = 'indexes/create-index/fields/CHANGE_FIELDS';

/**
 * The initial state of the field names.
 */
export const INITIAL_STATE = [{ name: '', type: '' }];

/**
 * Reducer function for handle state changes to the field names.
 *
 * @param {String} state - The change field names state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
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
  return state;
}

export const addField = () => ({
  type: ADD_FIELD,
});
export const removeField = (idx) => ({
  type: REMOVE_FIELD,
  idx: idx,
});
export const updateFieldType = (idx, fType) => ({
  type: UPDATE_FIELD_TYPE,
  idx: idx,
  fType: fType,
});
export const changeFields = (fields) => ({
  type: CHANGE_FIELDS,
  fields: fields,
});

export const updateFieldName = (idx, name) => {
  return (dispatch, getState) => {
    const state = getState();
    const fields = [...state.fields];
    if (idx >= 0 && idx < state.fields.length) {
      // check if field name exists
      if (state.fields.some((field) => field.name === name)) {
        dispatch(handleError('Index keys must be unique'));
        return;
      }
      const field = { ...fields[idx] };
      field.name = name;
      fields[idx] = field;
      dispatch(changeFields(fields));
      // check if field name exists in schemaFields, otherwise add
      if (!contains(state.schemaFields, name)) {
        const sFields = [...state.schemaFields];
        sFields.push(name);
        dispatch(changeSchemaFields(sFields));
      }
    }
  };
};
