/**
 * Create index columnstore projection action.
 */
export const CHANGE_COLUMNSTORE_PROJECTION =
  'indexes/create-index/columnstore-projection/CHANGE_COLUMNSTORE_PROJECTION';

type ColumnstoreProjectionState = string;

/**
 * The initial state of the columnstore projection.
 */
export const INITIAL_STATE = '';

type ColumnstoreProjectionAction = {
  type: typeof CHANGE_COLUMNSTORE_PROJECTION;
  columnstoreProjection: string;
};

/**
 * Reducer function for handle state changes to create columnstore projection.
 *
 * @param {String} state - The create columnstore projection state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(
  state = INITIAL_STATE,
  action: ColumnstoreProjectionAction
): ColumnstoreProjectionState {
  if (action.type === CHANGE_COLUMNSTORE_PROJECTION) {
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
export const changeColumnstoreProjection = (
  columnstoreProjection: string
): ColumnstoreProjectionAction => ({
  type: CHANGE_COLUMNSTORE_PROJECTION,
  columnstoreProjection,
});
