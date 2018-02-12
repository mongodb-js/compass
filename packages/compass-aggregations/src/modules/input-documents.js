/**
 * The action name prefix.
 */
const PREFIX = 'aggregations/input-documents';

/**
 * Input collapsed action name.
 */
export const TOGGLE_INPUT_COLLAPSED = `${PREFIX}/TOGGLE_INPUT_COLLAPSED`;

/**
 * The update input documents action.
 */
export const UPDATE_INPUT_DOCUMENTS = `${PREFIX}/UPDATE_INPUT_DOCUMENTS`;

/**
 * The filter constant.
 */
const FILTER = Object.freeze({});

/**
 * The options constant.
 */
const OPTIONS = Object.freeze({});

/**
 * The sample pipeline.
 */
const SAMPLE = [ Object.freeze({ '$sample': { 'size': 20 }}) ];

/**
 * The initial state.
 */
export const INITIAL_STATE = {
  count: 0,
  documents: [],
  error: null,
  isExpanded: true
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
  } else if (action.type === UPDATE_INPUT_DOCUMENTS) {
    return {
      ...state,
      count: action.count,
      documents: action.documents,
      error: action.error
    };
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

/**
 * Update the input documents.
 *
 * @param {Number} count - The count.
 * @param {Array} documents - The documents.
 *
 * @returns {Object} The update input documents action.
 */
export const updateInputDocuments = (count, documents, error) => ({
  type: UPDATE_INPUT_DOCUMENTS,
  count: count,
  documents: documents,
  error: error
});

/**
 * Refresh the input documents.
 *
 * @returns {Function} The function.
 */
export const refreshInputDocuments = () => {
  return (dispatch, getState) => {
    const state = getState();
    const dataService = state.dataService.dataService;
    const ns = state.namespace;
    dataService.count(ns, FILTER, OPTIONS, (error, count) => {
      if (error) return dispatch(updateInputDocuments(0, [], error));
      dataService.aggregate(ns, SAMPLE, OPTIONS, (err, cursor) => {
        if (err) return dispatch(updateInputDocuments(count, [], err));
        cursor.toArray((e, docs) => {
          dispatch(updateInputDocuments(count, docs, e));
        });
      });
    });
  };
};
