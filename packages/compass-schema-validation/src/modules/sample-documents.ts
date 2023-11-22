import preferences from 'compass-preferences-model';
import { checkValidator } from './validation';
import type { DataService } from 'mongodb-data-service';
import type { RootAction, RootState } from '.';

export const SAMPLE_SIZE = 10000;

/**
 * Initial state
 */
export type DOCUMENT_LOADING_STATES =
  | 'initial'
  | 'loading'
  | 'success'
  | 'error';

export interface SampleDocumentState {
  validDocumentState: DOCUMENT_LOADING_STATES;
  validDocument: undefined | Record<string, unknown>;

  invalidDocumentState: DOCUMENT_LOADING_STATES;
  invalidDocument: undefined | Record<string, unknown>;
}

export const INITIAL_STATE: SampleDocumentState = {
  validDocumentState: 'initial',
  validDocument: undefined,

  invalidDocumentState: 'initial',
  invalidDocument: undefined,
};

/**
 * Action names
 */

export const CLEAR_SAMPLE_DOCUMENTS =
  'validation/namespace/CLEAR_SAMPLE_DOCUMENTS' as const;
interface ClearSampleDocumentsAction {
  type: typeof CLEAR_SAMPLE_DOCUMENTS;
}

export const FETCHING_VALID_DOCUMENT =
  'validation/namespace/FETCHING_VALID_DOCUMENT' as const;
interface FetchingValidDocumentAction {
  type: typeof FETCHING_VALID_DOCUMENT;
}

export const FETCHED_VALID_DOCUMENT =
  'validation/namespace/FETCHED_VALID_DOCUMENT' as const;
interface FetchedValidDocumentAction {
  type: typeof FETCHED_VALID_DOCUMENT;
  document: Record<string, unknown>;
}

export const FETCHING_VALID_DOCUMENT_FAILED =
  'validation/namespace/FETCHING_VALID_DOCUMENT_FAILED' as const;
interface FetchingValidDocumentFailedAction {
  type: typeof FETCHING_VALID_DOCUMENT_FAILED;
}

export const FETCHING_INVALID_DOCUMENT =
  'validation/namespace/FETCHING_INVALID_DOCUMENT' as const;
interface FetchingInvalidDocumentAction {
  type: typeof FETCHING_INVALID_DOCUMENT;
}

export const FETCHED_INVALID_DOCUMENT =
  'validation/namespace/FETCHED_INVALID_DOCUMENT' as const;
interface FetchedInvalidDocumentAction {
  type: typeof FETCHED_INVALID_DOCUMENT;
  document: Record<string, unknown>;
}

export const FETCHING_INVALID_DOCUMENT_FAILED =
  'validation/namespace/FETCHING_INVALID_DOCUMENT_FAILED' as const;
interface FetchingInvalidDocumentFailedAction {
  type: typeof FETCHING_INVALID_DOCUMENT_FAILED;
}

export type SampleDocumentAction =
  | ClearSampleDocumentsAction
  | FetchingValidDocumentAction
  | FetchedValidDocumentAction
  | FetchingValidDocumentAction
  | FetchingInvalidDocumentAction
  | FetchedInvalidDocumentAction
  | FetchingInvalidDocumentFailedAction
  | FetchingValidDocumentFailedAction;

/**
 * Action creators
 */

export const clearSampleDocuments = (): ClearSampleDocumentsAction => ({
  type: CLEAR_SAMPLE_DOCUMENTS,
});

export const fetchingValidDocument = (): FetchingValidDocumentAction => ({
  type: FETCHING_VALID_DOCUMENT,
});

export const fetchingInvalidDocument = (): FetchingInvalidDocumentAction => ({
  type: FETCHING_INVALID_DOCUMENT,
});

export const fetchedValidDocument = (
  document: Record<string, unknown>
): FetchedValidDocumentAction => ({
  type: FETCHED_VALID_DOCUMENT,
  document,
});

export const fetchedInvalidDocument = (
  document: Record<string, unknown>
): FetchedInvalidDocumentAction => ({
  type: FETCHED_INVALID_DOCUMENT,
  document,
});

export const fetchingValidDocumentFailed =
  (): FetchingValidDocumentFailedAction => ({
    type: FETCHING_VALID_DOCUMENT_FAILED,
  });

export const fetchingInvalidDocumentFailed =
  (): FetchingInvalidDocumentFailedAction => ({
    type: FETCHING_INVALID_DOCUMENT_FAILED,
  });

/**
 * State reducers
 */

export const clearingSampleDocuments = (): SampleDocumentState => INITIAL_STATE;

export const startFetchingValidDocument = (
  state: SampleDocumentState
): SampleDocumentState => ({
  ...state,
  validDocumentState: 'loading',
});

export const startFetchingInvalidDocument = (
  state: SampleDocumentState
): SampleDocumentState => ({
  ...state,
  invalidDocumentState: 'loading',
});

export const updateStateWithFetchedValidDocument = (
  state: SampleDocumentState,
  action: FetchedValidDocumentAction
): SampleDocumentState => ({
  ...state,
  validDocumentState: 'success',
  validDocument: action.document,
});

export const updateStateWithFetchedInvalidDocument = (
  state: SampleDocumentState,
  action: FetchedInvalidDocumentAction
): SampleDocumentState => ({
  ...state,
  invalidDocumentState: 'success',
  invalidDocument: action.document,
});

export const validDocumentFetchErrored = (
  state: SampleDocumentState
): SampleDocumentState => ({
  ...state,
  validDocumentState: 'error',
  validDocument: undefined,
});

export const invalidDocumentFetchErrored = (
  state: SampleDocumentState
): SampleDocumentState => ({
  ...state,
  invalidDocumentState: 'error',
  invalidDocument: undefined,
});

const ACTION_TO_REDUCER_MAPPINGS: {
  [Type in SampleDocumentAction['type']]: (
    state: SampleDocumentState,
    action: SampleDocumentAction & { type: Type }
  ) => SampleDocumentState;
} = {
  [CLEAR_SAMPLE_DOCUMENTS]: clearingSampleDocuments,
  [FETCHING_VALID_DOCUMENT]: startFetchingValidDocument,
  [FETCHED_VALID_DOCUMENT]: updateStateWithFetchedValidDocument,
  [FETCHING_VALID_DOCUMENT_FAILED]: validDocumentFetchErrored,
  [FETCHING_INVALID_DOCUMENT]: startFetchingInvalidDocument,
  [FETCHED_INVALID_DOCUMENT]: updateStateWithFetchedInvalidDocument,
  [FETCHING_INVALID_DOCUMENT_FAILED]: invalidDocumentFetchErrored,
};

export default function (
  state: SampleDocumentState = INITIAL_STATE,
  action: RootAction
): SampleDocumentState {
  const fn =
    ACTION_TO_REDUCER_MAPPINGS[action.type as SampleDocumentAction['type']];

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore-error TS does not understand that action can be passed to fn
  return fn ? fn(state, action) : state;
}

/**
 * Side effects
 */

const getSampleDocuments = async ({
  pipeline,
  namespace,
  dataService,
}: {
  namespace: string;
  dataService: DataService;
  pipeline: Record<string, unknown>[];
}) => {
  const aggOptions = {
    allowDiskUse: true,
    maxTimeMS: preferences.getPreferences().maxTimeMS,
  };
  pipeline.unshift({ $sample: { size: SAMPLE_SIZE } });

  return await dataService.aggregate(namespace, pipeline, aggOptions);
};

export const fetchValidDocument = () => {
  return async (
    dispatch: (action: RootAction) => void,
    getState: () => RootState
  ) => {
    dispatch(fetchingValidDocument());

    const state = getState();
    const dataService = state.dataService;
    const namespace = state.namespace.ns;
    const validator = state.validation.validator;

    const checkedValidator = checkValidator(validator);
    const query = checkValidator(
      checkedValidator.validator as string
    ).validator;

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
  return async (
    dispatch: (action: RootAction) => void,
    getState: () => RootState
  ) => {
    dispatch(fetchingInvalidDocument());

    const state = getState();
    const dataService = state.dataService;
    const namespace = state.namespace.ns;
    const validator = state.validation.validator;

    // Calling checkValidator twice here seems wrong
    const checkedValidator = checkValidator(validator);
    const query = checkValidator(
      checkedValidator.validator as string
    ).validator;

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
