import type { AnyAction } from 'redux';

/**
 * Create index columnstore projection action.
 */
export const COLUMNSTORE_PROJECTION_CHANGED =
  'indexes/create-index/columnstore-projection/COLUMNSTORE_PROJECTION_CHANGED';

/**
 * The initial state of the columnstore projection.
 */
export const INITIAL_STATE = '';

/**
 * Reducer function for handle columnstore projection state changes.
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
 * The change columnstore projection action creator.
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
