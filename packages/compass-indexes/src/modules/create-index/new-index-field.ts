import type { AnyAction } from 'redux';

/**
 * The initial state of the new index field.
 */
export const INITIAL_STATE = null;

export enum ActionTypes {
  createNewIndexField = 'indexes/create-index/name/CREATE_NEW_INDEX_FIELD',
  clearNewIndexField = 'indexes/create-index/name/CLEAR_NEW_INDEX_FIELD',
}

/**
 * Reducer function for handle the new field state changes.
 *
 * @param state - The new index field state.
 * @param action - The action.
 *
 * @returns The new state.
 */
export default function reducer(state = INITIAL_STATE, action: AnyAction) {
  if (action.type === ActionTypes.createNewIndexField) {
    return action.newField;
  }
  if (action.type === ActionTypes.clearNewIndexField) {
    return null;
  }
  return state;
}

/**
 * Action creator for the create new index field event.
 *
 * @param newField - The new index field.
 *
 * @returns The action.
 */
export const createNewIndexField = (newField: string) => ({
  type: ActionTypes.createNewIndexField,
  newField,
});

/**
 * Action creator for the clear new index field event.
 *
 * @returns The action.
 */
export const clearNewIndexField = () => ({
  type: ActionTypes.clearNewIndexField,
});
