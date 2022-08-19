import type { AnyAction } from 'redux';

/**
 * Toggle use ttl action name.
 */
export const TOGGLE_USE_TTL = 'indexes/create-indexes/use-ttl/TOGGLE_USE_TTL';

/**
 * The initial state of the use ttl.
 */
export const INITIAL_STATE = false;

/**
 * Reducer function for handle state changes to the use ttl.
 *
 * @param state - The use ttl state.
 * @param action - The action.
 *
 * @returns The new state.
 */
export default function reducer(state = INITIAL_STATE, action: AnyAction) {
  if (action.type === TOGGLE_USE_TTL) {
    return action.useTtl;
  }
  return state;
}

/**
 * The toggle use ttl action creator.
 *
 * @param useTtl - use ttl.
 *
 * @returns The action.
 */
export const toggleUseTtl = (useTtl: boolean) => ({
  type: TOGGLE_USE_TTL,
  useTtl,
});
