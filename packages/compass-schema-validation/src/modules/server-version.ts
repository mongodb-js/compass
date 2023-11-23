import type { RootAction } from '.';

/**
 * Server version changed action.
 */
export const SERVER_VERSION_CHANGED =
  'validation/server-version/SERVER_VERSION_CHANGED' as const;
interface ServerVersionChangedAction {
  type: typeof SERVER_VERSION_CHANGED;
  version: string | null | undefined;
}

export type ServerVersionAction = ServerVersionChangedAction;
export type ServerVersionState = string;

/**
 * The initial state.
 */
export const INITIAL_STATE: ServerVersionState = '4.0.0';

/**
 * Reducer function for handle state changes to server version.
 */
export default function reducer(
  state: ServerVersionState = INITIAL_STATE,
  action: RootAction
): ServerVersionState {
  if (action.type === SERVER_VERSION_CHANGED) {
    return action.version || state;
  }

  return state;
}

/**
 * Action creator for server version changed events.
 */
export const serverVersionChanged = (
  version: string | null | undefined
): ServerVersionChangedAction => ({
  type: SERVER_VERSION_CHANGED,
  version,
});
