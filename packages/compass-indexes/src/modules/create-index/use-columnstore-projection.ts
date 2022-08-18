/**
 * Change use columnstore projection action name.
 */
export const TOGGLE_USE_COLUMNSTORE_PROJECTION =
  'indexes/create-indexes/is-columnstore/TOGGLE_USE_COLUMNSTORE_PROJECTION';

type UseColumnstoreProjectionState = boolean;

/**
 * The initial state of the use columnstore projection attribute.
 */
export const INITIAL_STATE: UseColumnstoreProjectionState = false;

type useColumnstoreProjectionAction = {
  type: typeof TOGGLE_USE_COLUMNSTORE_PROJECTION;
  useColumnstoreProjection: boolean;
};

/**
 * Reducer function for handle state changes to use columnstore projection.
 *
 * @param {Boolean} state - The has columnstore state.
 * @param {Object} action - The action.
 *
 * @returns {Array} The new state.
 */
export default function reducer(
  state = INITIAL_STATE,
  action: useColumnstoreProjectionAction
): UseColumnstoreProjectionState {
  if (action.type === TOGGLE_USE_COLUMNSTORE_PROJECTION) {
    return action.useColumnstoreProjection;
  }
  return state;
}

/**
 * The toggle use columnstore projection action creator.
 *
 * @param {Boolean} useColumnstoreProjection - use columnstore projection.
 *
 * @returns {Object} The action.
 */
export const toggleUseColumnstoreProjection = (
  useColumnstoreProjection: UseColumnstoreProjectionState
): useColumnstoreProjectionAction => ({
  type: TOGGLE_USE_COLUMNSTORE_PROJECTION,
  useColumnstoreProjection,
});
