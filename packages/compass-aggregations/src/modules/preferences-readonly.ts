import type { AnyAction } from 'redux';

/**
 * The preferencesReadOnly changed action name.
 */
export const PREFERENCES_READONLY_CHANGED =
 'aggregations/preferences-readonly/PREFERENCES_READONLY_CHANGED';

/**
 * The initial state of the preferencesReadOnly attribute.
 */
export const INITIAL_STATE = true;

/**
 * Reducer function.
 *
 * @param state - The state.
 * @param action - The action.
 *
 * @returns the new state.
 */
export default function reducer(state = INITIAL_STATE, action: AnyAction) {
  if (action.type === PREFERENCES_READONLY_CHANGED) {
    return action.preferencesReadOnly;
  }
  return state;
}

/**
 * Action creator for preferencesReadOnly changed events.
 *
 * @param preferencesReadOnly - Is preferencesReadOnly.
 *
 * @returns The preferencesReadOnly changed action.
 */
export const preferencesReadOnlyChanged = (preferencesReadOnly: boolean) => ({
  type: PREFERENCES_READONLY_CHANGED,
  preferencesReadOnly,
});
