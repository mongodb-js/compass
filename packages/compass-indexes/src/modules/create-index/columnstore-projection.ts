import type { AnyAction } from 'redux';

/**
 * Columnstore projection changed action name.
 */
export const COLUMNSTORE_PROJECTION_CHANGED =
  'indexes/create-index/columnstore-projection/COLUMNSTORE_PROJECTION_CHANGED';

/**
 * The initial state of the columnstore projection.
 */
export const INITIAL_STATE = '';

/**
 * Reducer function for handle the columnstore projection state changes.
 *
 * @param {String} state - The columnstore projection state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action: AnyAction) {
  if (action.type === COLUMNSTORE_PROJECTION_CHANGED) {
    return action.columnstoreProjection;
  }
  return state;
}

/**
 * Action creator for the columnstore projection changed event.
 *
 * @param {String} columnstoreProjection - The columnstore projection.
 *
 * @returns {Object} The action.
 */
export const columnstoreProjectionChanged = (
  columnstoreProjection: string
): AnyAction => ({
  type: COLUMNSTORE_PROJECTION_CHANGED,
  columnstoreProjection,
});
