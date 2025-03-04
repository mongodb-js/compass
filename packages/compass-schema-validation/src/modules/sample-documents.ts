import type { PreferencesAccess } from 'compass-preferences-model';
import { checkValidator } from './validation';
import type { DataService } from '@mongodb-js/compass-connections/provider';
import type { RootAction, SchemaValidationThunkAction } from '.';

export const SAMPLE_SIZE = 10000;

/**
 * Initial state
 */
export type DOCUMENT_LOADING_STATES = 'loading' | 'success' | 'error';

type InitialState = {
  validDocumentState: 'initial';
  invalidDocumentState: 'initial';
};

type LoadingState = {
  validDocumentState: DOCUMENT_LOADING_STATES;
  invalidDocumentState: DOCUMENT_LOADING_STATES;
};

export type SampleDocumentState = {
  validDocument: undefined | Record<string, unknown>;
  invalidDocument: undefined | Record<string, unknown>;
} & (InitialState | LoadingState);

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

export const FETCHING_SAMPLE_DOCUMENTS =
  'validation/namespace/FETCHING_SAMPLE_DOCUMENTS' as const;
interface FetchingSampleDocumentsAction {
  type: typeof FETCHING_SAMPLE_DOCUMENTS;
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

export type SampleDocumentNonInitialAction =
  | ClearSampleDocumentsAction
  | FetchedValidDocumentAction
  | FetchedInvalidDocumentAction
  | FetchingInvalidDocumentFailedAction
  | FetchingValidDocumentFailedAction;

/**
 * Action creators
 */

export const clearSampleDocuments = (): ClearSampleDocumentsAction => ({
  type: CLEAR_SAMPLE_DOCUMENTS,
});

export const fetchingSampleDocuments = (): FetchingSampleDocumentsAction => ({
  type: FETCHING_SAMPLE_DOCUMENTS,
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

export const startFetchingSampleDocuments = (
  state: SampleDocumentState
): SampleDocumentState => ({
  ...state,
  validDocumentState: 'loading',
  invalidDocumentState: 'loading',
});

export const updateStateWithFetchedValidDocument = (
  state: SampleDocumentState & LoadingState,
  action: FetchedValidDocumentAction
): SampleDocumentState => ({
  ...state,
  validDocumentState: 'success',
  validDocument: action.document,
});

export const updateStateWithFetchedInvalidDocument = (
  state: SampleDocumentState & LoadingState,
  action: FetchedInvalidDocumentAction
): SampleDocumentState => ({
  ...state,
  invalidDocumentState: 'success',
  invalidDocument: action.document,
});

export const validDocumentFetchErrored = (
  state: SampleDocumentState & LoadingState
): SampleDocumentState => ({
  ...state,
  validDocumentState: 'error',
  validDocument: undefined,
});

export const invalidDocumentFetchErrored = (
  state: SampleDocumentState & LoadingState
): SampleDocumentState => ({
  ...state,
  invalidDocumentState: 'error',
  invalidDocument: undefined,
});

const LOADING_ACTION_TO_REDUCER_MAPPINGS: {
  [Type in SampleDocumentNonInitialAction['type']]: (
    state: SampleDocumentState & LoadingState,
    action: SampleDocumentNonInitialAction & { type: Type }
  ) => SampleDocumentState;
} = {
  [CLEAR_SAMPLE_DOCUMENTS]: clearingSampleDocuments,
  [FETCHED_VALID_DOCUMENT]: updateStateWithFetchedValidDocument,
  [FETCHING_VALID_DOCUMENT_FAILED]: validDocumentFetchErrored,
  [FETCHED_INVALID_DOCUMENT]: updateStateWithFetchedInvalidDocument,
  [FETCHING_INVALID_DOCUMENT_FAILED]: invalidDocumentFetchErrored,
};

export default function (
  state: SampleDocumentState = INITIAL_STATE,
  action: RootAction
): SampleDocumentState {
  let fn;
  if (state.validDocumentState !== 'initial') {
    fn =
      LOADING_ACTION_TO_REDUCER_MAPPINGS[
        action.type as SampleDocumentNonInitialAction['type']
      ];
  } else if (action.type === FETCHING_SAMPLE_DOCUMENTS)
    fn = startFetchingSampleDocuments;

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
  preferences,
}: {
  namespace: string;
  dataService: Pick<DataService, 'aggregate'>;
  preferences: PreferencesAccess;
  pipeline: Record<string, unknown>[];
}) => {
  const aggOptions = {
    allowDiskUse: true,
    maxTimeMS: preferences.getPreferences().maxTimeMS,
  };
  pipeline.unshift({ $sample: { size: SAMPLE_SIZE } });

  return await dataService.aggregate(namespace, pipeline, aggOptions);
};

export const fetchSampleDocuments = (): SchemaValidationThunkAction<
  void,
  FetchingSampleDocumentsAction
> => {
  return (dispatch, getState) => {
    dispatch(fetchingSampleDocuments());

    const state = getState();
    const namespace = state.namespace.ns;
    const validator = state.validation.validator;

    const checkedValidator = checkValidator(validator);
    const query = checkValidator(
      checkedValidator.validator as string
    ).validator;

    void dispatch(fetchValidDocument({ namespace, query }));
    void dispatch(fetchInvalidDocument({ namespace, query }));
  };
};

const fetchValidDocument = ({
  namespace,
  query,
}: {
  namespace: string;
  query: string | Record<string, unknown>;
}): SchemaValidationThunkAction<
  Promise<void>,
  FetchedValidDocumentAction | FetchingValidDocumentFailedAction
> => {
  return async (dispatch, getState, { preferences, dataService }) => {
    try {
      const valid = (
        await getSampleDocuments({
          namespace,
          dataService,
          preferences,
          pipeline: [{ $match: query }, { $limit: 1 }],
        })
      )[0];

      dispatch(fetchedValidDocument(valid));
    } catch (e) {
      dispatch(fetchingValidDocumentFailed());
    }
  };
};

const fetchInvalidDocument = ({
  namespace,
  query,
}: {
  namespace: string;
  query: string | Record<string, unknown>;
}): SchemaValidationThunkAction<
  Promise<void>,
  FetchedInvalidDocumentAction | FetchingInvalidDocumentFailedAction
> => {
  return async (dispatch, getState, { preferences, dataService }) => {
    try {
      const invalid = (
        await getSampleDocuments({
          namespace,
          dataService,
          preferences,
          pipeline: [{ $match: { $nor: [query] } }, { $limit: 1 }],
        })
      )[0];

      dispatch(fetchedInvalidDocument(invalid));
    } catch (e) {
      dispatch(fetchingInvalidDocumentFailed());
    }
  };
};
