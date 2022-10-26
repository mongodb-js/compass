/**
 * The preferencesReadOnly changed action name.
 */
export const PREFERENCES_READONLY_CHANGED =
 'shell/preferences-readonly/PREFERENCES_READONLY_CHANGED';

/**
 * The initial state of the preferencesReadOnly attribute.
 */
export const INITIAL_STATE = false;

/**
 * Reducer function.
 *
 * @param {Array} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Array} the new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === PREFERENCES_READONLY_CHANGED) {
    return action.preferencesReadOnly;
  }
  return state;
}

/**
 * Action creator for preferencesReadOnly changed events.
 *
 * @param {Boolean} preferencesReadOnly - Is preferencesReadOnly.
 *
 * @returns {Object} The preferencesReadOnly changed action.
 */
export const preferencesReadOnlyChanged = (preferencesReadOnly) => ({
  type: PREFERENCES_READONLY_CHANGED,
  preferencesReadOnly,
});
