import type { AnyAction } from 'redux';

/**
 * Create index name action.
 */
export const NAME_CHANGED = 'indexes/drop-index/name/NAME_CHANGED';

/**
 * The initial state of the index name.
 */
export const INITIAL_STATE = '';

/**
 * Reducer function for handle state changes to create index name.
 *
 * @param state - The create index name state.
 * @param action - The action.
 *
 * @returns The new state.
 */
export default function reducer(
  state = INITIAL_STATE,
  action: AnyAction
): string {
  if (action.type === NAME_CHANGED) {
    return action.name;
  }
  return state;
}

/**
 * The change name action creator.
 *
 * @param name - The index name.
 *
 * @returns The action.
 */
export const nameChanged = (name: string) => ({
  type: NAME_CHANGED,
  name,
});
