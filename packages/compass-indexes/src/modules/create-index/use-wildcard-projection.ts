import type { AnyAction } from 'redux';

/**
 * Toggle use wildcard projection action name.
 */
export const TOGGLE_USE_WILDCARD_PROJECTION =
  'indexes/create-indexes/use-wildcard-projection/TOGGLE_USE_WILDCARD_PROJECTION';

/**
 * The initial state of the use wildcard projection.
 */
export const INITIAL_STATE = false;

/**
 * Reducer function for handle state changes to the use wildcard projection.
 *
 * @param state - The use wildcard projection state.
 * @param action - The action.
 *
 * @returns The new state.
 */
export default function reducer(
  state = INITIAL_STATE,
  action: AnyAction
): boolean {
  if (action.type === TOGGLE_USE_WILDCARD_PROJECTION) {
    return action.useWildcardProjection;
  }
  return state;
}

/**
 * The toggle use wildcard projection action creator.
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
