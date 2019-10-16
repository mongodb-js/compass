/**
 * The prefix.
 */
const PREFIX = 'export-to-language/copy-to-clipboard';
const { clipboard } = require('electron');

/**
 * CopyToClipboardFnChanged changed action.
 */
export const COPY_TO_CLIPBOARD_FN_CHANGED = `${PREFIX}/COPY_TO_CLIPBOARD_FN_CHANGED`;

/**
 * The initial state.
 */
export const INITIAL_STATE = (action) => {
  clipboard.writeText(action);
};

/**
 * Reducer function for handle state changes to copyToClipboardFnChanged.
 *
 * @param {String} state - The copyToClipboardFnChanged state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === COPY_TO_CLIPBOARD_FN_CHANGED) {
    return action.copyToClipboardFnChanged;
  }

  return state;
}

/**
 * Action creator for copyToClipboardFnChanged changed events.
 *
 * @param {String} copyToClipboardFnChanged - The copyToClipboardFnChanged value.
 *
 * @returns {Object} The copyToClipboardFnChanged changed action.
 */
export const copyToClipboardFnChanged = (copyToClipboard) => ({
  type: COPY_TO_CLIPBOARD_FN_CHANGED,
  copyToClipboard
});
