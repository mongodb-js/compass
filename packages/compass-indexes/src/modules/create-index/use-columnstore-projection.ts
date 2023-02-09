import type { AnyAction } from 'redux';

/**
 * Toggle use columnstore projection action name.
 */
export const TOGGLE_USE_COLUMNSTORE_PROJECTION =
  'indexes/create-indexes/use-columnstore/TOGGLE_USE_COLUMNSTORE_PROJECTION';

/**
 * The initial state of the use columnstore projection attribute.
 */
export const INITIAL_STATE = false;

/**
 * Reducer function for handle the columnstore projection state changes.
 *
 * @param state - The has columnstore state.
 * @param action - The action.
 *
 * @returns The new state.
 */
export default function reducer(
  state = INITIAL_STATE,
  action: AnyAction
): boolean {
  if (action.type === TOGGLE_USE_COLUMNSTORE_PROJECTION) {
    return action.useColumnstoreProjection;
  }
  return state;
}

/**
 * The toggle use columnstore projection action creator.
 *
 * @param useColumnstoreProjection - use columnstore projection.
 *
 * @returns The action.
 */
export const toggleUseColumnstoreProjection = (
  useColumnstoreProjection: boolean
) => ({
  type: TOGGLE_USE_COLUMNSTORE_PROJECTION,
  useColumnstoreProjection,
});
