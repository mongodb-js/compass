import type { AnyAction } from 'redux';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { isAction } from './../utils/is-action';
import {
  openToast,
  showConfirmation as showConfirmationModal,
} from '@mongodb-js/compass-components';
import type { Document, MongoServerError } from 'mongodb';
import toNS from 'mongodb-ns';

const ATLAS_SEARCH_SERVER_ERRORS: Record<string, string> = {
  InvalidIndexSpecificationOption: 'Invalid index definition.',
  IndexAlreadyExists:
    'This index name is already in use. Please choose another one.',
};
import type { SortDirection, IndexesThunkAction } from '.';

import type { SearchIndex } from 'mongodb-data-service';

const { debug } = createLoggerAndTelemetry('COMPASS-INDEXES');

export type SearchSortColumn = keyof typeof sortColumnToProps;

const sortColumnToProps = {
  'Name and Fields': 'name',
  Status: 'status',
} as const;

export enum SearchIndexesStatuses {
  /**
   * No support. Default status.
   */
  NOT_AVAILABLE = 'NOT_AVAILABLE',
  /**
   * Supported, but we do not have list of indexes yet.
   */
  PENDING = 'PENDING',
  /**
   * Supported and we have list of indexes.
   */
  READY = 'READY',
  /**
   * Supported and we are refreshing the list.
   */
  REFRESHING = 'REFRESHING',
  /**
   * Loading/refreshing the list failed.
   */
  ERROR = 'ERROR',
}

export type SearchIndexesStatus = keyof typeof SearchIndexesStatuses;

export enum ActionTypes {
  SetStatus = 'indexes/search-indexes/SetStatus',
  OpenCreateSearchIndexModal = 'indexes/search-indexes/OpenCreateSearchIndexModal',
  CreateSearchIndexStarted = 'indexes/search-indexes/CreateSearchIndexStarted',
  CreateSearchIndexFailed = 'indexes/search-indexes/CreateSearchIndexFailed',
  CreateSearchIndexSucceeded = 'indexes/search-indexes/CreateSearchIndexSucceed',
  CreateSearchIndexCancelled = 'indexes/search-indexes/CreateSearchIndexCancelled',
  SetIsRefreshing = 'indexes/search-indexes/SetIsRefreshing',
  SetSearchIndexes = 'indexes/search-indexes/SetSearchIndexes',
  SearchIndexesSorted = 'indexes/search-indexes/SearchIndexesSorted',
  SetError = 'indexes/search-indexes/SetError',
}

type SetIsRefreshingAction = {
  type: ActionTypes.SetIsRefreshing;
};

type OpenCreateSearchIndexModalAction = {
  type: ActionTypes.OpenCreateSearchIndexModal;
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

type CreateSearchIndexCancelledAction = {
  type: ActionTypes.CreateSearchIndexCancelled;
};

type CreateSearchIndexState = {
  isModalOpen: boolean;
  isBusy: boolean;
};

export type State = {
  status: SearchIndexesStatus;
  createIndex: CreateSearchIndexState;
  error?: string;
  indexes: SearchIndex[];
  sortOrder: SortDirection;
  sortColumn: SearchSortColumn;
};

type SetSearchIndexesAction = {
  type: ActionTypes.SetSearchIndexes;
  indexes: SearchIndex[];
};

type SearchIndexesSortedAction = {
  type: ActionTypes.SearchIndexesSorted;
  indexes: SearchIndex[];
  sortOrder: SortDirection;
  sortColumn: SearchSortColumn;
};

type SetErrorAction = {
  type: ActionTypes.SetError;
  error: string | undefined;
};

type SearchIndexesActions =
  | SetIsRefreshingAction
  | SetSearchIndexesAction
  | SearchIndexesSortedAction
  | SetErrorAction;

export const INITIAL_STATE: State = {
  status: SearchIndexesStatuses.NOT_AVAILABLE,
  createIndex: {
    isModalOpen: false,
    isBusy: false,
  },
  error: undefined,
  indexes: [],
  sortOrder: 'asc',
  sortColumn: 'Name and Fields',
};

export default function reducer(
  state = INITIAL_STATE,
  action: AnyAction
): State {
  if (isAction<SetIsRefreshingAction>(action, ActionTypes.SetIsRefreshing)) {
    return {
      ...state,
      status: SearchIndexesStatuses.REFRESHING,
      error: undefined,
    };
  }

  if (isAction<SetSearchIndexesAction>(action, ActionTypes.SetSearchIndexes)) {
    return {
      ...state,
      indexes: action.indexes,
      status: SearchIndexesStatuses.READY,
    };
  }

  if (
    isAction<SearchIndexesSortedAction>(action, ActionTypes.SearchIndexesSorted)
  ) {
    return {
      ...state,
      indexes: action.indexes,
      sortOrder: action.sortOrder,
      sortColumn: action.sortColumn,
    };
  }

  if (isAction<SetErrorAction>(action, ActionTypes.SetError)) {
    return {
      ...state,
      error: action.error,
      status: SearchIndexesStatuses.ERROR,
    };
  } else if (
    isAction<OpenCreateSearchIndexModalAction>(
      action,
      ActionTypes.OpenCreateSearchIndexModal
    )
  ) {
    return {
      ...state,
      error: undefined,
      createIndex: {
        ...state.createIndex,
        isModalOpen: true,
        isBusy: false,
      },
    };
  } else if (
    isAction<CreateSearchIndexCancelledAction>(
      action,
      ActionTypes.CreateSearchIndexCancelled
    )
  ) {
    return {
      ...state,
      error: undefined,
      createIndex: {
        ...state.createIndex,
        isModalOpen: false,
        isBusy: false,
      },
    };
  } else if (
    isAction<CreateSearchIndexStartedAction>(
      action,
      ActionTypes.CreateSearchIndexStarted
    )
  ) {
    return {
      ...state,
      error: undefined,
      createIndex: {
        ...state.createIndex,
        isBusy: true,
      },
    };
  } else if (
    isAction<CreateSearchIndexFailedAction>(
      action,
      ActionTypes.CreateSearchIndexFailed
    )
  ) {
    return {
      ...state,
      error: action.error,
      createIndex: {
        ...state.createIndex,
        isBusy: false,
      },
    };
  } else if (
    isAction<CreateSearchIndexSucceededAction>(
      action,
      ActionTypes.CreateSearchIndexSucceeded
    )
  ) {
    return {
      ...state,
      error: undefined,
      createIndex: {
        ...state.createIndex,
        isModalOpen: false,
        isBusy: false,
      },
    };
  }
  return state;
}

const setSearchIndexes = (indexes: SearchIndex[]): SetSearchIndexesAction => ({
  type: ActionTypes.SetSearchIndexes,
  indexes,
});

export const openModalForCreation = (): OpenCreateSearchIndexModalAction => ({
  type: ActionTypes.OpenCreateSearchIndexModal,
});

export const closeModal = (): CreateSearchIndexCancelledAction => ({
  type: ActionTypes.CreateSearchIndexCancelled,
});

export const createIndexStarted = (): CreateSearchIndexStartedAction => ({
  type: ActionTypes.CreateSearchIndexStarted,
});

export const createIndexFailed = (
  error: string
): CreateSearchIndexFailedAction => ({
  type: ActionTypes.CreateSearchIndexFailed,
  error: ATLAS_SEARCH_SERVER_ERRORS[error] || error,
});

export const createIndexSucceeded = (): CreateSearchIndexSucceededAction => ({
  type: ActionTypes.CreateSearchIndexSucceeded,
});

export const saveIndex = (
  indexName: string,
  indexDefinition: Document
): IndexesThunkAction<Promise<void>> => {
  return async function (dispatch, getState) {
    const { namespace, dataService } = getState();

    dispatch(createIndexStarted());

    if (indexName === '') {
      dispatch(createIndexFailed('Please enter the name of the index.'));
      return;
    }

    try {
      await dataService?.createSearchIndex(
        namespace,
        indexName,
        indexDefinition
      );
    } catch (ex) {
      dispatch(
        createIndexFailed(
          (ex as MongoServerError).codeName || (ex as Error).message
        )
      );
      return;
    }

    dispatch(createIndexSucceeded());
    openToast('search-index-creation-in-progress', {
      title: `Your index ${indexName} is in progress.`,
      dismissible: true,
      timeout: 5000,
      variant: 'success',
    });
    void dispatch(fetchSearchIndexes());
  };
};
const setError = (error: string | undefined): SetErrorAction => ({
  type: ActionTypes.SetError,
  error,
});

const setIsRefreshing = (): SetIsRefreshingAction => ({
  type: ActionTypes.SetIsRefreshing,
});

export const fetchSearchIndexes = (): IndexesThunkAction<
  Promise<void>,
  SearchIndexesActions
> => {
  return async (dispatch, getState) => {
    const {
      isReadonlyView,
      dataService,
      namespace,
      searchIndexes: { sortColumn, sortOrder, status },
    } = getState();

    if (isReadonlyView) {
      return;
    }

    if (!dataService || !dataService.isConnected()) {
      debug('warning: trying to load indexes but dataService is disconnected');
      return;
    }

    if (status !== SearchIndexesStatuses.PENDING) {
      // 2nd time onwards set the status to refreshing
      dispatch(setIsRefreshing());
    }

    try {
      const indexes = await dataService.getSearchIndexes(namespace);
      const sortedIndexes = _sortIndexes(indexes, sortColumn, sortOrder);
      dispatch(setSearchIndexes(sortedIndexes));
    } catch (err) {
      dispatch(setError((err as Error).message));
    }
  };
};

export const refreshSearchIndexes = (): IndexesThunkAction<void> => {
  return (dispatch) => {
    void dispatch(fetchSearchIndexes());
  };
};

export const sortSearchIndexes = (
  column: SearchSortColumn,
  direction: SortDirection
): IndexesThunkAction<void, SearchIndexesSortedAction> => {
  return (dispatch, getState) => {
    const {
      searchIndexes: { indexes },
    } = getState();

    const sortedIndexes = _sortIndexes(indexes, column, direction);

    dispatch({
      type: ActionTypes.SearchIndexesSorted,
      indexes: sortedIndexes,
      sortOrder: direction,
      sortColumn: column,
    });
  };
};

// Exporting this for test only to stub it and set
// its value. This enables to test dropSearchIndex action.
export const showConfirmation = showConfirmationModal;
export const dropSearchIndex = (
  name: string
): IndexesThunkAction<Promise<void>> => {
  return async function (dispatch, getState) {
    const { namespace, dataService } = getState();
    if (!dataService) {
      return;
    }

    const isConfirmed = await showConfirmation({
      title: `Are you sure you want to drop "${name}" from Cluster?`,
      buttonText: 'Drop Index',
      variant: 'danger',
      requiredInputText: name,
      description:
        'If you drop default, all queries using it will no longer function',
    });
    if (!isConfirmed) {
      return;
    }

    try {
      await dataService.dropSearchIndex(namespace, name);
      openToast('search-index-delete-in-progress', {
        title: `Your index ${name} is being deleted.`,
        dismissible: true,
        timeout: 5000,
        variant: 'success',
      });
      void dispatch(fetchSearchIndexes());
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

// todo: clean up
export const runAggregateSearchIndex = (
  name: string
): IndexesThunkAction<Promise<void>> => {
  return async function (dispatch, getState) {
    const {
      searchIndexes: { indexes },
      appRegistry: { globalAppRegistry },
      dataService,
      instance,
      namespace,
    } = getState();
    const searchIndex = indexes.find((x) => x.name === name);
    if (!searchIndex || !instance || !dataService) {
      return;
    }

    const { database, collection } = toNS(namespace);

    const coll = await instance.getNamespace({
      dataService,
      database,
      collection,
    });

    if (!coll) {
      return;
    }

    const metadata = await coll.fetchMetadata({ dataService });

    globalAppRegistry.emit('open-namespace-in-new-tab', {
      ...metadata, // todo: get from instance
      aggregation: `[
        {
          $search: {
            name: ${name},
            $text: {
              query: <user_input>,
              path: <user_input>
            },
          }
        }
      ]`,
    });
  };
};

function _sortIndexes(
  indexes: SearchIndex[],
  column: SearchSortColumn,
  direction: SortDirection
) {
  const order = direction === 'asc' ? 1 : -1;
  const field = sortColumnToProps[column];

  return [...indexes].sort(function (a: SearchIndex, b: SearchIndex) {
    if (typeof b[field] === 'undefined') {
      return order;
    }
    if (typeof a[field] === 'undefined') {
      return -order;
    }
    if (a[field]! > b[field]!) {
      return order;
    }
    if (a[field]! < b[field]!) {
      return -order;
    }
    return 0;
  });
}
