import type { AnyAction } from 'redux';
import { isEqual } from 'lodash';
import {
  openToast,
  showConfirmation as showConfirmationModal,
} from '@mongodb-js/compass-components';
import type { Document } from 'mongodb';
import type { SearchIndex } from 'mongodb-data-service';

import { isAction } from '../utils/is-action';
import { FetchStatuses, NOT_FETCHABLE_STATUSES } from '../utils/fetch-status';
import type { FetchStatus } from '../utils/fetch-status';

import { FetchReasons } from '../utils/fetch-reason';
import type { FetchReason } from '../utils/fetch-reason';

import type { IndexesThunkAction } from '.';
import { switchToSearchIndexes } from './index-view';
import type { IndexViewChangedAction } from './index-view';

const ATLAS_SEARCH_SERVER_ERRORS: Record<string, string> = {
  InvalidIndexSpecificationOption: 'Invalid index definition.',
  IndexAlreadyExists:
    'This index name is already in use. Please choose another one.',
};

export enum ActionTypes {
  // Fetch indexes
  FetchSearchIndexesStarted = 'compass-indexes/search-indexes/fetch-search-indexes-started',
  FetchSearchIndexesSucceeded = 'compass-indexes/search-indexes/fetch-search-indexes-succeeded',
  FetchSearchIndexesFailed = 'compass-indexes/search-indexes/fetch-search-indexes-failed',

  // Create Index
  CreateSearchIndexOpened = 'compass-indexes/search-indexes/create-search-index-opened',
  CreateSearchIndexClosed = 'compass-indexes/search-indexes/create-search-index-closed',
  CreateSearchIndexStarted = 'compass-indexes/search-indexes/create-search-index-started',
  CreateSearchIndexFailed = 'compass-indexes/search-indexes/create-search-index-failed',
  CreateSearchIndexSucceeded = 'compass-indexes/search-indexes/create-search-index-succeeded',

  // Update Index
  UpdateSearchIndexOpened = 'compass-indexes/search-indexes/update-search-index-opened',
  UpdateSearchIndexClosed = 'compass-indexes/search-indexes/update-search-index-closed',
  UpdateSearchIndexStarted = 'compass-indexes/search-indexes/update-search-index-started',
  UpdateSearchIndexFailed = 'compass-indexes/search-indexes/update-search-index-failed',
  UpdateSearchIndexSucceeded = 'compass-indexes/search-indexes/update-search-index-succeeded',
}

type FetchSearchIndexesStartedAction = {
  type: ActionTypes.FetchSearchIndexesStarted;
  reason: FetchReason;
};

type FetchSearchIndexesSucceededAction = {
  type: ActionTypes.FetchSearchIndexesSucceeded;
  indexes: SearchIndex[];
};

type FetchSearchIndexesFailedAction = {
  type: ActionTypes.FetchSearchIndexesFailed;
  error: string;
};

export type CreateSearchIndexOpenedAction = {
  type: ActionTypes.CreateSearchIndexOpened;
};

type CreateSearchIndexStartedAction = {
  type: ActionTypes.CreateSearchIndexStarted;
};

type CreateSearchIndexFailedAction = {
  type: ActionTypes.CreateSearchIndexFailed;
  error: string;
};

type CreateSearchIndexSucceededAction = {
  type: ActionTypes.CreateSearchIndexSucceeded;
};

type CreateSearchIndexClosedAction = {
  type: ActionTypes.CreateSearchIndexClosed;
};

type UpdateSearchIndexOpenedAction = {
  type: ActionTypes.UpdateSearchIndexOpened;
  indexName: string;
};

type UpdateSearchIndexStartedAction = {
  type: ActionTypes.UpdateSearchIndexStarted;
};

type UpdateSearchIndexFailedAction = {
  type: ActionTypes.UpdateSearchIndexFailed;
  error: string;
};

type UpdateSearchIndexSucceededAction = {
  type: ActionTypes.UpdateSearchIndexSucceeded;
};

type UpdateSearchIndexClosedAction = {
  type: ActionTypes.UpdateSearchIndexClosed;
};

type CreateSearchIndexState = {
  isModalOpen: boolean;
  isBusy: boolean;
  error?: string;
};

type UpdateSearchIndexState = {
  isModalOpen: boolean;
  isBusy: boolean;
  indexName: string;
  error?: string;
};

export type State = {
  status: FetchStatus;
  createIndex: CreateSearchIndexState;
  updateIndex: UpdateSearchIndexState;
  error?: string;
  indexes: SearchIndex[];
};

export const INITIAL_STATE: State = {
  status: FetchStatuses.NOT_READY,
  createIndex: {
    isModalOpen: false,
    isBusy: false,
  },
  updateIndex: {
    isModalOpen: false,
    isBusy: false,
    indexName: '',
  },
  error: undefined,
  indexes: [],
};

export default function reducer(
  state = INITIAL_STATE,
  action: AnyAction
): State {
  if (
    isAction<CreateSearchIndexOpenedAction>(
      action,
      ActionTypes.CreateSearchIndexOpened
    )
  ) {
    return {
      ...state,
      createIndex: {
        isModalOpen: true,
        isBusy: false,
      },
    };
  }

  if (
    isAction<CreateSearchIndexClosedAction>(
      action,
      ActionTypes.CreateSearchIndexClosed
    )
  ) {
    return {
      ...state,
      createIndex: {
        isModalOpen: false,
        isBusy: false,
      },
    };
  }

  if (
    isAction<CreateSearchIndexStartedAction>(
      action,
      ActionTypes.CreateSearchIndexStarted
    )
  ) {
    return {
      ...state,
      createIndex: {
        ...state.createIndex,
        isBusy: true,
        error: undefined,
      },
    };
  }

  if (
    isAction<CreateSearchIndexFailedAction>(
      action,
      ActionTypes.CreateSearchIndexFailed
    )
  ) {
    return {
      ...state,
      createIndex: {
        ...state.createIndex,
        error: action.error,
        isBusy: false,
      },
    };
  }

  if (
    isAction<CreateSearchIndexSucceededAction>(
      action,
      ActionTypes.CreateSearchIndexSucceeded
    )
  ) {
    return {
      ...state,
      createIndex: {
        isModalOpen: false,
        isBusy: false,
      },
    };
  }

  if (
    isAction<UpdateSearchIndexOpenedAction>(
      action,
      ActionTypes.UpdateSearchIndexOpened
    )
  ) {
    return {
      ...state,
      updateIndex: {
        isModalOpen: true,
        isBusy: false,
        indexName: action.indexName,
      },
    };
  }

  if (
    isAction<UpdateSearchIndexStartedAction>(
      action,
      ActionTypes.UpdateSearchIndexStarted
    )
  ) {
    return {
      ...state,
      updateIndex: {
        ...state.updateIndex,
        error: undefined,
        isBusy: true,
      },
    };
  }

  if (
    isAction<UpdateSearchIndexFailedAction>(
      action,
      ActionTypes.UpdateSearchIndexFailed
    )
  ) {
    return {
      ...state,
      updateIndex: {
        ...state.updateIndex,
        error: action.error,
        isBusy: false,
      },
    };
  }

  if (
    isAction<UpdateSearchIndexSucceededAction>(
      action,
      ActionTypes.UpdateSearchIndexSucceeded
    )
  ) {
    return {
      ...state,
      updateIndex: {
        // We do not clear the indexName here to avoid flicker created by LG
        // Modal as it closes.
        ...state.updateIndex,
        isBusy: false,
        isModalOpen: false,
      },
    };
  }

  if (
    isAction<UpdateSearchIndexClosedAction>(
      action,
      ActionTypes.UpdateSearchIndexClosed
    )
  ) {
    return {
      ...state,
      updateIndex: {
        ...state.updateIndex,
        isModalOpen: false,
        isBusy: false,
      },
    };
  }

  if (
    isAction<FetchSearchIndexesStartedAction>(
      action,
      ActionTypes.FetchSearchIndexesStarted
    )
  ) {
    return {
      ...state,
      status:
        action.reason === FetchReasons.POLL
          ? FetchStatuses.POLLING
          : action.reason === FetchReasons.REFRESH
          ? FetchStatuses.REFRESHING
          : FetchStatuses.FETCHING,
    };
  }

  if (
    isAction<FetchSearchIndexesSucceededAction>(
      action,
      ActionTypes.FetchSearchIndexesSucceeded
    )
  ) {
    return {
      ...state,
      indexes: action.indexes,
      status: FetchStatuses.READY,
    };
  }

  if (
    isAction<FetchSearchIndexesFailedAction>(
      action,
      ActionTypes.FetchSearchIndexesFailed
    )
  ) {
    return {
      ...state,
      // We do no set any error on poll or refresh and the
      // previous list of indexes is shown to the user.
      // If fetch fails for refresh or polling, set the status to READY again.
      error:
        state.status === FetchStatuses.FETCHING ? action.error : state.error,
      status:
        state.status === FetchStatuses.FETCHING
          ? FetchStatuses.ERROR
          : FetchStatuses.READY,
    };
  }

  return state;
}

export const createSearchIndexOpened = (): CreateSearchIndexOpenedAction => ({
  type: ActionTypes.CreateSearchIndexOpened,
});

export const updateSearchIndexOpened = (
  indexName: string
): UpdateSearchIndexOpenedAction => ({
  type: ActionTypes.UpdateSearchIndexOpened,
  indexName,
});

export const createSearchIndexClosed = (): CreateSearchIndexClosedAction => ({
  type: ActionTypes.CreateSearchIndexClosed,
});

export const updateSearchIndexClosed = (): UpdateSearchIndexClosedAction => ({
  type: ActionTypes.UpdateSearchIndexClosed,
});

const fetchSearchIndexesStarted = (
  reason: FetchReason
): FetchSearchIndexesStartedAction => ({
  type: ActionTypes.FetchSearchIndexesStarted,
  reason,
});

const fetchSearchIndexesSucceeded = (
  indexes: SearchIndex[]
): FetchSearchIndexesSucceededAction => ({
  type: ActionTypes.FetchSearchIndexesSucceeded,
  indexes,
});

const fetchSearchIndexesFailed = (
  error: string
): FetchSearchIndexesFailedAction => ({
  type: ActionTypes.FetchSearchIndexesFailed,
  error,
});

const createSearchIndexStarted = (): CreateSearchIndexStartedAction => ({
  type: ActionTypes.CreateSearchIndexStarted,
});

const createSearchIndexFailed = (
  error: string
): CreateSearchIndexFailedAction => ({
  type: ActionTypes.CreateSearchIndexFailed,
  error,
});

const createSearchIndexSucceeded = (): CreateSearchIndexSucceededAction => ({
  type: ActionTypes.CreateSearchIndexSucceeded,
});

const updateSearchIndexStarted = (): UpdateSearchIndexStartedAction => ({
  type: ActionTypes.UpdateSearchIndexStarted,
});

const updateSearchIndexFailed = (
  error: string
): UpdateSearchIndexFailedAction => ({
  type: ActionTypes.UpdateSearchIndexFailed,
  error,
});

const updateSearchIndexSucceeded = (): UpdateSearchIndexSucceededAction => ({
  type: ActionTypes.UpdateSearchIndexSucceeded,
});

export const POLLING_INTERVAL = 5000;

export const startPollingSearchIndexes = (): IndexesThunkAction<
  void,
  FetchSearchIndexesActions
> => {
  return function (dispatch, _getState, { pollingIntervalRef }) {
    if (pollingIntervalRef.searchIndexes !== null) {
      return;
    }
    pollingIntervalRef.searchIndexes = setInterval(() => {
      void dispatch(pollSearchIndexes());
    }, POLLING_INTERVAL);
  };
};

export const stopPollingSearchIndexes = (): IndexesThunkAction<void, never> => {
  return (_dispatch, _getState, { pollingIntervalRef }) => {
    if (pollingIntervalRef.searchIndexes === null) {
      return;
    }
    clearInterval(pollingIntervalRef.searchIndexes);
    pollingIntervalRef.searchIndexes = null;
  };
};

export const createIndex = ({
  name,
  type,
  definition,
}: {
  name: string;
  type?: string;
  definition: Document;
}): IndexesThunkAction<
  Promise<void>,
  | CreateSearchIndexStartedAction
  | CreateSearchIndexSucceededAction
  | CreateSearchIndexFailedAction
  | IndexViewChangedAction
> => {
  return async function (
    dispatch,
    getState,
    { track, connectionInfoRef, dataService }
  ) {
    const { namespace } = getState();

    dispatch(createSearchIndexStarted());

    if (name === '') {
      dispatch(createSearchIndexFailed('Please enter the name of the index.'));
      return;
    }

    try {
      await dataService.createSearchIndex(namespace, {
        name,
        definition,
        ...(type
          ? {
              type,
            }
          : {}),
      });
    } catch (ex) {
      const error = (ex as Error).message;

      dispatch(
        createSearchIndexFailed(ATLAS_SEARCH_SERVER_ERRORS[error] || error)
      );
      return;
    }

    dispatch(createSearchIndexSucceeded());
    track(
      'Index Created',
      {
        atlas_search: true,
        type,
      },
      connectionInfoRef.current
    );

    openToast('search-index-creation-in-progress', {
      title: `Your index ${name} is in progress.`,
      dismissible: true,
      timeout: 5000,
      variant: 'progress',
    });

    dispatch(switchToSearchIndexes());
    await dispatch(fetchIndexes(FetchReasons.REFRESH));
  };
};

export const updateIndex = ({
  name,
  definition,
}: {
  name: string;
  type?: string;
  definition: Document;
}): IndexesThunkAction<
  Promise<void>,
  | UpdateSearchIndexClosedAction
  | UpdateSearchIndexStartedAction
  | UpdateSearchIndexSucceededAction
  | UpdateSearchIndexFailedAction
> => {
  return async function (
    dispatch,
    getState,
    { track, connectionInfoRef, dataService }
  ) {
    const {
      namespace,
      searchIndexes: { indexes },
    } = getState();

    const currentIndexDefinition = indexes.find(
      (x) => x.name === name
    )?.latestDefinition;
    if (isEqual(currentIndexDefinition, definition)) {
      dispatch(updateSearchIndexClosed());
      return;
    }

    try {
      dispatch(updateSearchIndexStarted());
      await dataService.updateSearchIndex(namespace, name, definition);
      dispatch(updateSearchIndexSucceeded());
      track(
        'Index Edited',
        {
          atlas_search: true,
        },
        connectionInfoRef.current
      );
      openToast('search-index-update-in-progress', {
        title: `Your index ${name} is being updated.`,
        dismissible: true,
        timeout: 5000,
        variant: 'progress',
      });
      await dispatch(fetchIndexes(FetchReasons.REFRESH));
    } catch (e) {
      const error = (e as Error).message;
      dispatch(
        updateSearchIndexFailed(ATLAS_SEARCH_SERVER_ERRORS[error] || error)
      );
      return;
    }
  };
};

type FetchSearchIndexesActions =
  | FetchSearchIndexesStartedAction
  | FetchSearchIndexesSucceededAction
  | FetchSearchIndexesFailedAction;

const fetchIndexes = (
  reason: FetchReason
): IndexesThunkAction<Promise<void>, FetchSearchIndexesActions> => {
  return async (dispatch, getState, { dataService }) => {
    const {
      isReadonlyView,
      isWritable,
      namespace,
      searchIndexes: { status },
    } = getState();

    if (isReadonlyView || !isWritable) {
      return;
    }

    // If we are already fetching indexes, we will wait for that
    if (NOT_FETCHABLE_STATUSES.includes(status)) {
      return;
    }

    try {
      dispatch(fetchSearchIndexesStarted(reason));
      const indexes = await dataService.getSearchIndexes(namespace);
      dispatch(fetchSearchIndexesSucceeded(indexes));
    } catch (err) {
      dispatch(fetchSearchIndexesFailed((err as Error).message));
    }
  };
};

export const fetchSearchIndexes = (): IndexesThunkAction<
  Promise<void>,
  FetchSearchIndexesActions
> => {
  return async (dispatch) => {
    await dispatch(fetchIndexes(FetchReasons.INITIAL_FETCH));
  };
};

export const refreshSearchIndexes = (): IndexesThunkAction<
  Promise<void>,
  FetchSearchIndexesActions
> => {
  return async (dispatch) => {
    await dispatch(fetchIndexes(FetchReasons.REFRESH));
  };
};

export const pollSearchIndexes = (): IndexesThunkAction<
  Promise<void>,
  FetchSearchIndexesActions
> => {
  return async (dispatch) => {
    return await dispatch(fetchIndexes(FetchReasons.POLL));
  };
};

// Exporting this for test only to stub it and set
// its value. This enables to test dropSearchIndex action.
export const showConfirmation = showConfirmationModal;

export const dropSearchIndex = (
  name: string
): IndexesThunkAction<Promise<void>, FetchSearchIndexesActions> => {
  return async function (
    dispatch,
    getState,
    { track, connectionInfoRef, dataService }
  ) {
    const { namespace } = getState();

    const isConfirmed = await showConfirmation({
      title: `Are you sure you want to drop "${name}" from Cluster?`,
      buttonText: 'Drop Index',
      variant: 'danger',
      requiredInputText: name,
      description:
        'If you drop this index, all queries using it will no longer function.',
    });
    if (!isConfirmed) {
      return;
    }

    try {
      await dataService.dropSearchIndex(namespace, name);
      track(
        'Index Dropped',
        {
          atlas_search: true,
        },
        connectionInfoRef.current
      );
      openToast('search-index-delete-in-progress', {
        title: `Your index ${name} is being deleted.`,
        dismissible: true,
        timeout: 5000,
        variant: 'progress',
      });
      await dispatch(fetchIndexes(FetchReasons.REFRESH));
    } catch (e) {
      openToast('search-index-delete-failed', {
        title: `Failed to drop index.`,
        description: (e as Error).message,
        dismissible: true,
        timeout: 5000,
        variant: 'warning',
      });
    }
  };
};

export function getInitialSearchIndexPipeline(name: string) {
  return [
    {
      $search: {
        index: name,
        text: {
          query: 'string',
          path: 'string',
        },
      },
    },
  ];
}

export function getInitialVectorSearchIndexPipelineText(name: string) {
  return `[
  {
    $vectorSearch: {
      // Name of the Atlas Vector Search index to use.
      index: ${JSON.stringify(name)},
      // Indexed vectorEmbedding type field to search.
      "path": "<field-to-search>",
      // Array of numbers that represent the query vector.
      // The array size must match the number of vector dimensions specified in the index definition for the field.
      "queryVector": [],
      // Number of nearest neighbors to use during the search.
      // Value must be less than or equal to (<=) 10000.
      "numCandidates": 50,
      "limit": 10,
      // Any MQL match expression that compares an indexed field with a boolean,
      // number (not decimals), or string to use as a prefilter.
      "filter": {}
    },
  },
]`;
}
