import type { AnyAction } from 'redux';

/**
 * Toggle is running action name.
 */
export const TOGGLE_IS_RUNNING =
  'databases-collections/is-running/TOGGLE_IS_RUNNING';

/**
 * The initial state of the is running attribute.
 */
export const INITIAL_STATE = false;

/**
 * Reducer function for handle state changes to is running.
 */
export default function reducer(
  state = INITIAL_STATE,
  action: AnyAction
): boolean {
  if (action.type === TOGGLE_IS_RUNNING) {
    return action.isRunning;
  }
  return state;
}

/**
 * The toggle is running action creator.
 */
export const toggleIsRunning = (isRunning: boolean) => ({
  type: TOGGLE_IS_RUNNING,
  isRunning: isRunning,
});
