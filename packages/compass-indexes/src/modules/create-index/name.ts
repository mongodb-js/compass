import type { AnyAction } from 'redux';

/**
 * Name changed action name.
 */
export const NAME_CHANGED = 'indexes/create-index/name/NAME_CHANGED';

/**
 * The initial state of the index name.
 */
export const INITIAL_STATE = '';

/**
 * Reducer function for handle the name state changes.
 *
 * @param state - The name state.
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
 * Action creator for the name changed event.
 *
 * @param name - The name.
 *
 * @returns The action.
 */
export const nameChanged = (name: string) => ({
  type: NAME_CHANGED,
  name,
});
