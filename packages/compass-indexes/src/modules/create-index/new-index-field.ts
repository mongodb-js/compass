import type { AnyAction } from 'redux';

/**
 * The initial state of the new index field.
 */
export const INITIAL_STATE = null;

export enum ActionTypes {
  createNewIndexField = 'indexes/create-index/name/CREATE_NEW_INDEX_FIELD',
  clearNewIndexField = 'indexes/create-index/name/CLEAR_NEW_INDEX_FIELD',
}

type CreateNewIndexFieldAction = {
  type: ActionTypes.createNewIndexField;
  newField: string;
};

type ClearNewIndexFieldAction = {
  type: ActionTypes.clearNewIndexField;
};

/**
 * Reducer function for handle state changes.
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
 * The create new index field action creator.
 *
 * @param {String} newField - The new index field.
 *
 * @returns {Object} The action.
 */
export const createNewIndexField = (
  newField: string
): CreateNewIndexFieldAction => ({
  type: ActionTypes.createNewIndexField,
  newField: newField,
});

/**
 * The clear new index field action creator.
 *
 * @returns {Object} The action.
 */
export const clearNewIndexField = (): ClearNewIndexFieldAction => ({
  type: ActionTypes.clearNewIndexField,
});
