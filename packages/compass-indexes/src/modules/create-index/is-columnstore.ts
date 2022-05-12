/**
 * Change is columnstore action name.
 */
export const TOGGLE_IS_COLUMNSTORE =
  'indexes/create-indexes/is-columnstore/TOGGLE_IS_COLUMNSTORE';

type IsColumnstoreState = boolean;

/**
 * The initial state of the is writable attribute.
 */
export const INITIAL_STATE: IsColumnstoreState = false;

type IsColumnstoreAction = {
  type: typeof TOGGLE_IS_COLUMNSTORE;
  isColumnstore: boolean;
};

/**
 * Reducer function for handle state changes to is columnstore.
 *
 * @param {Boolean} state - The is columnstore state.
 * @param {Object} action - The action.
 *
 * @returns {Array} The new state.
 */
export default function reducer(
  state = INITIAL_STATE,
  action: IsColumnstoreAction
): IsColumnstoreState {
  if (action.type === TOGGLE_IS_COLUMNSTORE) {
    return action.isColumnstore;
  }
  return state;
}

/**
 * The toggle is columnstore action creator.
 *
 * @param {Boolean} isColumnstore - Is columnstore.
 *
 * @returns {Object} The action.
 */
export const toggleIsColumnstore = (
  isColumnstore: IsColumnstoreState
): IsColumnstoreAction => ({
  type: TOGGLE_IS_COLUMNSTORE,
  isColumnstore: isColumnstore,
});
