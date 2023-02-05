import preferences from 'compass-preferences-model';
import { checkValidator } from './validation';

export const SAMPLE_SIZE = 10000;

/**
 * Initial state
 */

export const DOCUMENT_LOADING_STATES = {
  INITIAL: 'initial',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};

export const INITIAL_STATE = {
  validDocumentState: DOCUMENT_LOADING_STATES.INITIAL,
  validDocument: undefined,

  invalidDocumentState: DOCUMENT_LOADING_STATES.INITIAL,
  invalidDocument: undefined,
};

/**
 * Action names
 */

export const CLEAR_SAMPLE_DOCUMENTS =
  'validation/namespace/CLEAR_SAMPLE_DOCUMENTS';

export const FETCHING_VALID_DOCUMENT =
  'validation/namespace/FETCHING_VALID_DOCUMENT';

export const FETCHED_VALID_DOCUMENT =
  'validation/namespace/FETCHED_VALID_DOCUMENT';

export const FETCHING_VALID_DOCUMENT_FAILED =
  'validation/namespace/FETCHING_VALID_DOCUMENT_FAILED';

export const FETCHING_INVALID_DOCUMENT =
  'validation/namespace/FETCHING_INVALID_DOCUMENT';

export const FETCHED_INVALID_DOCUMENT =
  'validation/namespace/FETCHED_INVALID_DOCUMENT';

export const FETCHING_INVALID_DOCUMENT_FAILED =
  'validation/namespace/FETCHING_INVALID_DOCUMENT_FAILED';

/**
 * Action creators
 */

export const clearSampleDocuments = () => ({
  type: CLEAR_SAMPLE_DOCUMENTS,
});

export const fetchingValidDocument = () => ({
  type: FETCHING_VALID_DOCUMENT,
});

export const fetchingInvalidDocument = () => ({
  type: FETCHING_INVALID_DOCUMENT,
});

export const fetchedValidDocument = (document) => ({
  type: FETCHED_VALID_DOCUMENT,
  document,
});

export const fetchedInvalidDocument = (document) => ({
  type: FETCHED_INVALID_DOCUMENT,
  document,
});

export const fetchingValidDocumentFailed = () => ({
  type: FETCHING_VALID_DOCUMENT_FAILED,
});

export const fetchingInvalidDocumentFailed = () => ({
  type: FETCHING_INVALID_DOCUMENT_FAILED,
});

/**
 * State reducers
 */

export const clearingSampleDocuments = () => INITIAL_STATE;

export const startFetchingValidDocument = (state) => ({
  ...state,
  validDocumentState: DOCUMENT_LOADING_STATES.LOADING,
});

export const startFetchingInvalidDocument = (state) => ({
  ...state,
  invalidDocumentState: DOCUMENT_LOADING_STATES.LOADING,
});

export const updateStateWithFetchedValidDocument = (state, action) => ({
  ...state,
  validDocumentState: DOCUMENT_LOADING_STATES.SUCCESS,
  validDocument: action.document,
});

export const updateStateWithFetchedInvalidDocument = (state, action) => ({
  ...state,
  invalidDocumentState: DOCUMENT_LOADING_STATES.SUCCESS,
  invalidDocument: action.document,
});

export const validDocumentFetchErrored = (state) => ({
  ...state,
  validDocumentState: DOCUMENT_LOADING_STATES.ERROR,
  validDocument: undefined,
});

export const invalidDocumentFetchErrored = (state) => ({
  ...state,
  invalidDocumentState: DOCUMENT_LOADING_STATES.ERROR,
  invalidDocument: undefined,
});

const ACTION_TO_REDUCER_MAPPINGS = {
  [CLEAR_SAMPLE_DOCUMENTS]: clearingSampleDocuments,
  [FETCHING_VALID_DOCUMENT]: startFetchingValidDocument,
  [FETCHED_VALID_DOCUMENT]: updateStateWithFetchedValidDocument,
  [FETCHING_VALID_DOCUMENT_FAILED]: validDocumentFetchErrored,
  [FETCHING_INVALID_DOCUMENT]: startFetchingInvalidDocument,
  [FETCHED_INVALID_DOCUMENT]: updateStateWithFetchedInvalidDocument,
  [FETCHING_INVALID_DOCUMENT_FAILED]: invalidDocumentFetchErrored,
};

export default function (state = INITIAL_STATE, action) {
  const fn = ACTION_TO_REDUCER_MAPPINGS[action.type];

  return fn ? fn(state, action) : state;
}

/**
 * Side effects
 */

const getSampleDocuments = async (docsOptions) => {
  const aggOptions = {
    allowDiskUse: true,
    maxTimeMS: preferences.getPreferences().maxTimeMS,
  };
  const { pipeline, namespace, dataService } = docsOptions;
  pipeline.unshift({ $sample: { size: SAMPLE_SIZE } });

  return await dataService.aggregate(namespace, pipeline, aggOptions);
};

export const fetchValidDocument = () => {
  return async (dispatch, getState) => {
    dispatch(fetchingValidDocument());

    const state = getState();
    const dataService = state.dataService.dataService;
    const namespace = state.namespace.ns;
    const validator = state.validation.validator;

    const checkedValidator = checkValidator(validator);
    const query = checkValidator(checkedValidator.validator).validator;

    if (!dataService) {
      return;
    }

    try {
      const valid = (
        await getSampleDocuments({
          namespace,
          dataService,
          pipeline: [{ $match: query }, { $limit: 1 }],
        })
      )[0];

      dispatch(fetchedValidDocument(valid));
    } catch (e) {
      dispatch(fetchingValidDocumentFailed());
    }
  };
};

export const fetchInvalidDocument = () => {
  return async (dispatch, getState) => {
    dispatch(fetchingInvalidDocument());

    const state = getState();
    const dataService = state.dataService.dataService;
    const namespace = state.namespace.ns;
    const validator = state.validation.validator;

    const checkedValidator = checkValidator(validator);
    const query = checkValidator(checkedValidator.validator).validator;

    if (!dataService) {
      return;
    }

    try {
      const invalid = (
        await getSampleDocuments({
          namespace,
          dataService,
          pipeline: [{ $match: { $nor: [query] } }, { $limit: 1 }],
        })
      )[0];

      dispatch(fetchedInvalidDocument(invalid));
    } catch (e) {
      dispatch(fetchingInvalidDocumentFailed());
    }
  };
};
