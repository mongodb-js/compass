/**
 * The enableShell changed action name.
 */
export const ENABLE_SHELL_CHANGED =
 'shell/enable-shell/ENABLE_SHELL_CHANGED';

/**
 * The initial state of the enableShell attribute.
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
  if (action.type === ENABLE_SHELL_CHANGED) {
    return action.enableShell;
  }
  return state;
}

/**
 * Action creator for enableShell changed events.
 *
 * @param {Boolean} enableShell - Is shell enabled.
 *
 * @returns {Object} The enableShell changed action.
 */
export const enableShellChanged = (enableShell) => ({
  type: ENABLE_SHELL_CHANGED,
  enableShell,
});
