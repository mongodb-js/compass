import type { AnyAction } from 'redux';

import preferences from 'compass-preferences-model';

/**
 * The readonly changed action name.
 */
export const READONLY_CHANGED = 'indexes/is-readonly/READONLY_CHANGED';

/**
 * The initial state of the is readonly attribute.
 */
export const INITIAL_STATE = !!preferences.getPreferences().readOnly;

/**
 * Reducer function doesn't do anything since we're based on process.
 *
 * @param state - The state.
 * @param action - The action.
 *
 * @returns he state.
 */
export default function reducer(state = INITIAL_STATE, action: AnyAction) {
  if (action.type === READONLY_CHANGED) {
    return action.isReadonly;
  }
  return state;
}

/**
 * Action creator for readonly changed events.
 *
 * @param isReadonly - Is the readonly.
 *
 * @returns The readonly view changed action.
 */
export const readonlyChanged = (isReadonly: boolean) => ({
  type: READONLY_CHANGED,
  isReadonly,
});
