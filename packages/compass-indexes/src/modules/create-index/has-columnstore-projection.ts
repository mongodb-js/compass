/**
 * Change has columnstore projection action name.
 */
export const TOGGLE_HAS_COLUMNSTORE_PROJECTION =
  'indexes/create-indexes/is-columnstore/TOGGLE_HAS_COLUMNSTORE_PROJECTION';

type HasColumnstoreProjectionState = boolean;

/**
 * The initial state of the has columnstore projection attribute.
 */
export const INITIAL_STATE: HasColumnstoreProjectionState = false;

type hasColumnstoreProjectionAction = {
  type: typeof TOGGLE_HAS_COLUMNSTORE_PROJECTION;
  hasColumnstoreProjection: boolean;
};

/**
 * Reducer function for handle state changes to has columnstore projection.
 *
 * @param {Boolean} state - The has columnstore state.
 * @param {Object} action - The action.
 *
 * @returns {Array} The new state.
 */
export default function reducer(
  state = INITIAL_STATE,
  action: hasColumnstoreProjectionAction
): HasColumnstoreProjectionState {
  if (action.type === TOGGLE_HAS_COLUMNSTORE_PROJECTION) {
    return action.hasColumnstoreProjection;
  }
  return state;
}

/**
 * The toggle has columnstore projection action creator.
 *
 * @param {Boolean} hasColumnstoreProjection - has columnstore projection.
 *
 * @returns {Object} The action.
 */
export const toggleHasColumnstoreProjection = (
  hasColumnstoreProjection: HasColumnstoreProjectionState
): hasColumnstoreProjectionAction => ({
  type: TOGGLE_HAS_COLUMNSTORE_PROJECTION,
  hasColumnstoreProjection: hasColumnstoreProjection,
});
