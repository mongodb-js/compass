import preferences from 'compass-preferences-model';

/**
 * The readonly changed action name.
 */
export const READONLY_CHANGED = 'sidebar/is-readonly/READONLY_CHANGED';

/**
 * The initial state of the is readonly attribute.
 */
export const INITIAL_STATE = !!preferences.getPreferences().readOnly;

/**
 * Reducer function doesn't do anything since we're based on process.
 *
 * @param {Array} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Array} The state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === READONLY_CHANGED) {
    return action.isReadonly;
  }
  return state;
}

/**
 * Action creator for readonly changed events.
 *
 * @param {Boolean} isReadonly - Is the readonly.
 *
 * @returns {Object} The readonly view changed action.
 */
export const readonlyChanged = (isReadonly) => ({
  type: READONLY_CHANGED,
  isReadonly,
});
