const debug = require('debug')('mongodb-aggregations:modules:input-document');

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
 * Loading input documents action name.
 */
export const LOADING_INPUT_DOCUMENTS = `${PREFIX}/LOADING_INPUT_DOCUMENTS`;

/**
 * N/A contant.
 */
const NA = 'N/A';

/**
 * The initial state.
 */
export const INITIAL_STATE = {
  count: 0,
  documents: [],
  error: null,
  isExpanded: true,
  isLoading: false
};

/**
 * Reducer function for handle state changes to input documents.
 *
 * @param {Object} state - The input documents state.
 * @param {Object} action - The action.
 *
 * @returns {any} The new state.
 */
const reducer = (state = INITIAL_STATE, action) => {
  if (action.type === TOGGLE_INPUT_COLLAPSED) {
    return { ...state, isExpanded: !state.isExpanded };
  } else if (action.type === LOADING_INPUT_DOCUMENTS) {
    return { ...state, isLoading: true };
  } else if (action.type === UPDATE_INPUT_DOCUMENTS) {
    return {
      ...state,
      count: action.count,
      documents: action.documents,
      error: action.error,
      isLoading: false
    };
  }
  return state;
};

export default reducer;

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
 * @param {Error} error - The error.
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
 * The loading input documents action.
 *
 * @returns {Object} The action.
 */
export const loadingInputDocuments = () => ({
  type: LOADING_INPUT_DOCUMENTS
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

    const options = {
      maxTimeMS: state.settings.maxTimeMS
    };

    const exampleDocumentsPipeline = [{ $limit: state.settings.sampleSize }];

    if (dataService && dataService.isConnected()) {
      dispatch(loadingInputDocuments());
      dataService.estimatedCount(ns, options, (error, count) => {
        dataService.aggregate(
          ns,
          exampleDocumentsPipeline,
          options,
          (err, cursor) => {
            if (err) {
              return dispatch(
                updateInputDocuments(error ? NA : count, [], err)
              );
            }
            cursor.toArray((e, docs) => {
              dispatch(updateInputDocuments(error ? NA : count, docs, e));
              cursor.close();
            });
          }
        );
      });
    } else if (dataService && !dataService.isConnected()) {
      debug(
        'warning: trying to refresh aggregation but dataService is disconnected',
        dataService
      );
    }
  };
};
