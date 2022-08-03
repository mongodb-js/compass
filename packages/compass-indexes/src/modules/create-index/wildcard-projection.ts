import type { AnyAction } from 'redux';

/**
 * Create index wildcard projection action.
 */
export const WILDCARD_PROJECTION_CHANGED =
  'indexes/create-index/wildcard-projection/WILDCARD_PROJECTION_CHANGED';

/**
 * The initial state of the wildcard projection.
 */
export const INITIAL_STATE = '';

/**
 * Reducer function for handle wildcard projection state changes.
 *
 * @param {String} state - The wildcard projection state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action: AnyAction) {
  if (action.type === WILDCARD_PROJECTION_CHANGED) {
    return action.wildcardProjection;
  }
  return state;
}

/**
 * The change wildcard projection action creator.
 *
 * @param {String} wildcardProjection - The wildcard projection.
 *
 * @returns {Object} The action.
 */
export const wildcardProjectionChanged = (
  wildcardProjection: string
): AnyAction => ({
  type: WILDCARD_PROJECTION_CHANGED,
  wildcardProjection,
});
