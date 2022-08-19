import type { AnyAction } from 'redux';

/**
 * Create index ttl action.
 */
export const TTL_CHANGED = 'indexes/create-index/ttl/TTL_CHANGED';

/**
 * The initial state of the index ttl.
 */
export const INITIAL_STATE = '';

/**
 * Reducer function for handle state changes to create index ttl.
 *
 * @param state - The create index ttl state.
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
 * The change ttl action creator.
 *
 * @param ttl - The ttl.
 *
 * @returns The action.
 */
export const ttlChanged = (ttl: string) => ({
  type: TTL_CHANGED,
  ttl,
});
