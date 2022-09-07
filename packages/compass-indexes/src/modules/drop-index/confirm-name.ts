import type { AnyAction } from 'redux';

/**
 * Create confirm name action.
 */
export const CHANGE_CONFIRM_NAME =
  'indexes/drop-index/confirm-name/CHANGE_CONFIRM_NAME';

/**
 * The initial state of the confirm name.
 */
export const INITIAL_STATE = '';

/**
 * Reducer function for handle state changes to create confirm name.
 *
 * @param state - The create confirm name state.
 * @param action - The action.
 *
 * @returns The new state.
 */
export default function reducer(
  state = INITIAL_STATE,
  action: AnyAction
): string {
  if (action.type === CHANGE_CONFIRM_NAME) {
    return action.name;
  }
  return state;
}

/**
 * The change name action creator.
 *
 * @param name - The confirm name.
 *
 * @returns The action.
 */
export const changeConfirmName = (name: string) => ({
  type: CHANGE_CONFIRM_NAME,
  name,
});
