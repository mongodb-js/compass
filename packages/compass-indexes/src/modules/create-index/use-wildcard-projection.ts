import type { AnyAction } from 'redux';

/**
 * Change is wildcard action name.
 */
export const TOGGLE_USE_WILDCARD_PROJECTION =
  'indexes/create-indexes/use-wildcard-projection/TOGGLE_USE_WILDCARD_PROJECTION';

/**
 * The initial state of the is writable attribute.
 */
export const INITIAL_STATE = false;

/**
 * Reducer function for handle state changes to is wildcard.
 *
 * @param state - The is wildcard state.
 * @param action - The action.
 *
 * @returns The new state.
 */
export default function reducer(state = INITIAL_STATE, action: AnyAction) {
  if (action.type === TOGGLE_USE_WILDCARD_PROJECTION) {
    return action.useWildcardProjection;
  }
  return state;
}

/**
 * The toggle is wildcard action creator.
 *
 * @param useWildcardProjection - Is wildcard.
 *
 * @returns The action.
 */
export const toggleUseWildcardProjection = (
  useWildcardProjection: boolean
) => ({
  type: TOGGLE_USE_WILDCARD_PROJECTION,
  useWildcardProjection,
});
