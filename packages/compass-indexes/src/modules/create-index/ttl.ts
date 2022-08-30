import type { AnyAction } from 'redux';

/**
 * Ttl changed action name.
 */
export const TTL_CHANGED = 'indexes/create-index/ttl/TTL_CHANGED';

/**
 * The initial state of the ttl.
 */
export const INITIAL_STATE = '';

/**
 * Reducer function for handle the ttl state changes.
 *
 * @param state - The ttl state.
 * @param action - The action.
 *
 * @returns The new state.
 */
export default function reducer(state = INITIAL_STATE, action: AnyAction) {
  if (action.type === TTL_CHANGED) {
    return action.ttl;
  }
  return state;
}

/**
 * Action creator for the ttl changed event.
 *
 * @param ttl - The ttl.
 *
 * @returns The action.
 */
export const ttlChanged = (ttl: string) => ({
  type: TTL_CHANGED,
  ttl,
});
