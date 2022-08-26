import type { AnyAction } from 'redux';

/**
 * Wildcard projection changed action name.
 */
export const WILDCARD_PROJECTION_CHANGED =
  'indexes/create-index/wildcard-projection/WILDCARD_PROJECTION_CHANGED';

/**
 * The initial state of the wildcard projection.
 */
export const INITIAL_STATE = '';

/**
 * Reducer function for handle the wildcard projection state changes.
 *
 * @param state - The wildcard projection state.
 * @param action - The action.
 *
 * @returns The new state.
 */
export default function reducer(state = INITIAL_STATE, action: AnyAction) {
  if (action.type === WILDCARD_PROJECTION_CHANGED) {
    return action.wildcardProjection;
  }
  return state;
}

/**
 * Action creator for the wildcard projection changed event.
 *
 * @param wildcardProjection - The wildcard projection.
 *
 * @returns The action.
 */
export const wildcardProjectionChanged = (
  wildcardProjection: string
): AnyAction => ({
  type: WILDCARD_PROJECTION_CHANGED,
  wildcardProjection,
});
