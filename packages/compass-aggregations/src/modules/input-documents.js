import { capMaxTimeMSAtPreferenceLimit } from 'compass-preferences-model';
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
 * Loading input documents aciton name.
 */
export const LOADING_INPUT_DOCUMENTS = `${PREFIX}/LOADING_INPUT_DOCUMENTS`;

/**
 * The initial state.
 */
export const INITIAL_STATE = {
  count: null,
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
  return async (dispatch, getState) => {
    const state = getState();
    const dataService = state.dataService.dataService;

    if (!dataService) {
      return;
    }

    if (dataService && !dataService.isConnected()) {
      debug(
        'warning: trying to refresh aggregation but dataService is disconnected',
        dataService
      );
    }

    const ns = state.namespace;

    const options = {
      maxTimeMS: capMaxTimeMSAtPreferenceLimit(state.settings.maxTimeMS)
    };

    const exampleDocumentsPipeline = [{ $limit: state.settings.sampleSize }];

    dispatch(loadingInputDocuments());

    try {
      const data = await Promise.allSettled([
        dataService.estimatedCount(ns, options),
        dataService.aggregate(ns, exampleDocumentsPipeline, options)
      ]);

      const count = data[0].status === 'fulfilled' ? data[0].value : null;
      const docs = data[1].status === 'fulfilled' ? data[1].value : [];

      const error = data[0].status === 'rejected'
        ? data[0].reason
        : data[1].status === 'rejected'
        ? data[1].reason
        : null;
      dispatch(updateInputDocuments(count, docs, error));
    } catch (error) {
      dispatch(updateInputDocuments(null, [], error));
    }
  };
};
