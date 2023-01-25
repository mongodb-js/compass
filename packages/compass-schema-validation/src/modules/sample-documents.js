import preferences from 'compass-preferences-model';
import { checkValidator, syntaxErrorOccurred } from './validation';

export const SAMPLE_SIZE = 10000;

/**
 * Initial state
 */

export const INITIAL_STATE = {
  validDocumentLoading: false,
  validDocument: null, // Possible states - null (yet to fetch), undefined (no document/s), document/s

  invalidDocumentLoading: false,
  invalidDocument: null // Possible states - null (yet to fetch), undefined (no document/s), document/s
};

/**
 * Action names
 */

export const FETCHING_VALID_DOCUMENT =
  'validation/namespace/FETCHING_VALID_DOCUMENT';

export const FETCHED_VALID_DOCUMENT =
  'validation/namespace/FETCHED_VALID_DOCUMENT';

export const FETCHING_INVALID_DOCUMENT =
  'validation/namespace/FETCHING_INVALID_DOCUMENT';

export const FETCHED_INVALID_DOCUMENT =
  'validation/namespace/FETCHED_INVALID_DOCUMENT';


/**
 * Action creators
 */

export const fetchingValidDocument = () => ({
  type: FETCHING_VALID_DOCUMENT
});

export const fetchingInvalidDocument = () => ({
  type: FETCHING_INVALID_DOCUMENT
});

export const fetchedValidDocument = (document) => ({
  type: FETCHED_VALID_DOCUMENT,
  document
});

export const fetchedInvalidDocument = (document) => ({
  type: FETCHED_INVALID_DOCUMENT,
  document
});

/**
 * State reducers
 */

export const startFetchingValidDocument = (state) => ({
  ...state,
  validDocumentLoading: true
});

export const startFetchingInvalidDocument = (state) => ({
  ...state,
  invalidDocumentLoading: true
});

export const updateStateWithFetchedValidDocument = (state, action) => ({
  ...state,
  validDocumentLoading: false,
  validDocument: action.document
});

export const updateStateWithFetchedInvalidDocument = (state, action) => ({
  ...state,
  invalidDocumentLoading: false,
  invalidDocument: action.document
});

const ACTION_TO_REDUCER_MAPPINGS = {
  [FETCHING_VALID_DOCUMENT]: startFetchingValidDocument,
  [FETCHED_VALID_DOCUMENT]: updateStateWithFetchedValidDocument,
  [FETCHING_INVALID_DOCUMENT]: startFetchingInvalidDocument,
  [FETCHED_INVALID_DOCUMENT]: updateStateWithFetchedInvalidDocument
}

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

      const valid = (await getSampleDocuments({
        namespace,
        dataService,
        pipeline: [{ $match: query }, { $limit: 1 }],
      }))[0];

      dispatch(fetchedValidDocument(valid))
      
    } catch (e) {
      dispatch(fetchedValidDocument());
      dispatch(syntaxErrorOccurred(e));
    }
  }
}

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

      const invalid = (await getSampleDocuments({
        namespace,
        dataService,
        pipeline: [{ $match: { $nor: [query] } }, { $limit: 1 }],
      }))[0];

      dispatch(fetchedInvalidDocument(invalid))
      
    } catch (e) {
      dispatch(fetchedInvalidDocument());
      dispatch(syntaxErrorOccurred(e));
    }
  }
}

export const clearSampleDocuments = () =>
  (dispatch) => {
    dispatch(fetchedValidDocument(null));
    dispatch(fetchedInvalidDocument(null));
  }
