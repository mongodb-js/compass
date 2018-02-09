/**
 * The action name prefix.
 */
const PREFIX = 'aggregations/input-documents';

/**
 * Input collapsed action name.
 */
export const TOGGLE_INPUT_COLLAPSED = `${PREFIX}/TOGGLE_INPUT_COLLAPSED`;

/**
 * The initial state.
 */
export const INITIAL_STATE = {
  documents: [],
  isExpanded: true,
  count: 0
};

/**
 * Reducer function for handle state changes to input documents.
 *
 * @param {Object} state - The input documents state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === TOGGLE_INPUT_COLLAPSED) {
    return { ...state, isExpanded: !state.isExpanded };
  }
  return state;
}

/**
 * Action creator for namespace changed events.
 *
 * @returns {Object} The namespace changed action.
 */
export const toggleInputDocumentsCollapsed = () => ({
  type: TOGGLE_INPUT_COLLAPSED
});
