/**
 * The prefix.
 */
const PREFIX = 'export-to-language/output-lang';

/**
 * OutputLang changed action.
 */
export const OUTPUT_LANG_CHANGED = `${PREFIX}/OUTPUT_LANG_CHANGED`;

/**
 * The initial state.
 */
export const INITIAL_STATE = 'python';

/**
 * Reducer function for handle state changes to outputLang.
 *
 * @param {String} state - The outputLang state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === OUTPUT_LANG_CHANGED) {
    return action.outputLang;
  }

  return state;
}

/**
 * Action creator for outputLang changed events.
 *
 * @param {String} outputLang - The outputLang value.
 *
 * @returns {Object} The outputLang changed action.
 */
export const outputLangChanged = (outputLang) => ({
  type: OUTPUT_LANG_CHANGED,
  outputLang,
});
