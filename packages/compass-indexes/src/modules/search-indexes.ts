import type { AnyAction } from 'redux';
import { isEqual } from 'lodash';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { isAction } from './../utils/is-action';
import {
  openToast,
  showConfirmation as showConfirmationModal,
} from '@mongodb-js/compass-components';
import type { Document } from 'mongodb';

const ATLAS_SEARCH_SERVER_ERRORS: Record<string, string> = {
  InvalidIndexSpecificationOption: 'Invalid index definition.',
  IndexAlreadyExists:
    'This index name is already in use. Please choose another one.',
};
import type { SortDirection, IndexesThunkAction } from '.';

import type { SearchIndex } from 'mongodb-data-service';
import { switchToSearchIndexes } from './index-view';

const { debug, track } = createLoggerAndTelemetry('COMPASS-INDEXES-UI');

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
   * We do not have list yet.
   */
  NOT_READY = 'NOT_READY',
  /**
   * We have list of indexes.
   */
  READY = 'READY',
  /**
   * We are fetching the list first time.
   */
  FETCHING = 'FETCHING',
  /**
   * We are refreshing the list.
   */
  REFRESHING = 'REFRESHING',
  /**
   * We are polling the list.
   */
  POLLING = 'POLLING',
  /**
   * Loading the list failed.
   */
  ERROR = 'ERROR',
}

export type SearchIndexesStatus = keyof typeof SearchIndexesStatuses;

// List of SearchIndex statuses when server should not be called
// to avoid multiple requests.
const NOT_FETCHABLE_STATUSES: SearchIndexesStatus[] = [
  'NOT_AVAILABLE',
  'FETCHING',
  'POLLING',
  'REFRESHING',
];

export enum ActionTypes {
  SetStatus = 'indexes/search-indexes/SetStatus',
  SetSearchIndexes = 'indexes/search-indexes/SetSearchIndexes',
  SearchIndexesSorted = 'indexes/search-indexes/SearchIndexesSorted',
  SetError = 'indexes/search-indexes/SetError',

  // Create Index
  OpenCreateSearchIndexModal = 'indexes/search-indexes/OpenCreateSearchIndexModal',
  CreateSearchIndexStarted = 'indexes/search-indexes/CreateSearchIndexStarted',
  CreateSearchIndexFailed = 'indexes/search-indexes/CreateSearchIndexFailed',
  CreateSearchIndexSucceeded = 'indexes/search-indexes/CreateSearchIndexSucceed',
  CreateSearchIndexCancelled = 'indexes/search-indexes/CreateSearchIndexCancelled',

  // Update Index
  OpenUpdateSearchIndexModal = 'indexes/search-indexes/OpenUpdateSearchIndexModal',
  UpdateSearchIndexStarted = 'indexes/search-indexes/UpdateSearchIndexStarted',
  UpdateSearchIndexFailed = 'indexes/search-indexes/UpdateSearchIndexFailed',
  UpdateSearchIndexSucceeded = 'indexes/search-indexes/UpdateSearchIndexSucceed',
  UpdateSearchIndexCancelled = 'indexes/search-indexes/UpdateSearchIndexCancelled',
}

type SetStatusAction = {
  type: ActionTypes.SetStatus;
  status: SearchIndexesStatus;
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

type OpenUpdateSearchIndexModalAction = {
  type: ActionTypes.OpenUpdateSearchIndexModal;
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

type UpdateSearchIndexCancelledAction = {
  type: ActionTypes.UpdateSearchIndexCancelled;
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
  status: SearchIndexesStatus;
  createIndex: CreateSearchIndexState;
  updateIndex: UpdateSearchIndexState;
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

export const INITIAL_STATE: State = {
  status: SearchIndexesStatuses.NOT_AVAILABLE,
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
  sortOrder: 'asc',
  sortColumn: 'Name and Fields',
};

export default function reducer(
  state = INITIAL_STATE,
  action: AnyAction
): State {
  if (isAction<SetStatusAction>(action, ActionTypes.SetStatus)) {
    return {
      ...state,
      status: action.status,
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
  }

  if (
    isAction<OpenCreateSearchIndexModalAction>(
      action,
      ActionTypes.OpenCreateSearchIndexModal
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
    isAction<CreateSearchIndexCancelledAction>(
      action,
      ActionTypes.CreateSearchIndexCancelled
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
    isAction<OpenUpdateSearchIndexModalAction>(
      action,
      ActionTypes.OpenUpdateSearchIndexModal
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
    isAction<UpdateSearchIndexCancelledAction>(
      action,
      ActionTypes.UpdateSearchIndexCancelled
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

  return state;
}

const setSearchIndexes = (indexes: SearchIndex[]): SetSearchIndexesAction => ({
  type: ActionTypes.SetSearchIndexes,
  indexes,
});

export const showCreateModal = (): OpenCreateSearchIndexModalAction => ({
  type: ActionTypes.OpenCreateSearchIndexModal,
});

export const showUpdateModal = (
  indexName: string
): OpenUpdateSearchIndexModalAction => ({
  type: ActionTypes.OpenUpdateSearchIndexModal,
  indexName,
});

export const closeCreateModal = (): CreateSearchIndexCancelledAction => ({
  type: ActionTypes.CreateSearchIndexCancelled,
});

export const closeUpdateModal = (): UpdateSearchIndexCancelledAction => ({
  type: ActionTypes.UpdateSearchIndexCancelled,
});

export const createIndex = (
  indexName: string,
  indexDefinition: Document
): IndexesThunkAction<Promise<void>> => {
  return async function (dispatch, getState) {
    const { namespace, dataService } = getState();

    dispatch({ type: ActionTypes.CreateSearchIndexStarted });

    if (indexName === '') {
      dispatch({
        type: ActionTypes.CreateSearchIndexFailed,
        error: 'Please enter the name of the index.',
      });
      return;
    }

    try {
      await dataService?.createSearchIndex(
        namespace,
        indexName,
        indexDefinition
      );
    } catch (ex) {
      const error = (ex as Error).message;
      dispatch({
        type: ActionTypes.CreateSearchIndexFailed,
        error: ATLAS_SEARCH_SERVER_ERRORS[error] || error,
      });
      return;
    }

    dispatch({ type: ActionTypes.CreateSearchIndexSucceeded });
    track('Index Created', {
      atlas_search: true,
    });

    openToast('search-index-creation-in-progress', {
      title: `Your index ${indexName} is in progress.`,
      dismissible: true,
      timeout: 5000,
      variant: 'progress',
    });

    void dispatch(switchToSearchIndexes());
    void dispatch(fetchIndexes(SearchIndexesStatuses.REFRESHING));
  };
};

export const updateIndex = (
  indexName: string,
  indexDefinition: Document
): IndexesThunkAction<Promise<void>> => {
  return async function (dispatch, getState) {
    const {
      namespace,
      dataService,
      searchIndexes: { indexes },
    } = getState();

    const currentIndexDefinition = indexes.find(
      (x) => x.name === indexName
    )?.latestDefinition;
    if (isEqual(currentIndexDefinition, indexDefinition)) {
      dispatch(closeUpdateModal());
      return;
    }

    try {
      dispatch({ type: ActionTypes.UpdateSearchIndexStarted });
      await dataService?.updateSearchIndex(
        namespace,
        indexName,
        indexDefinition
      );
      dispatch({ type: ActionTypes.UpdateSearchIndexSucceeded });
      track('Index Edited', {
        atlas_search: true,
      });
      openToast('search-index-update-in-progress', {
        title: `Your index ${indexName} is being updated.`,
        dismissible: true,
        timeout: 5000,
        variant: 'progress',
      });
      void dispatch(fetchIndexes(SearchIndexesStatuses.REFRESHING));
    } catch (e) {
      const error = (e as Error).message;
      dispatch({
        type: ActionTypes.UpdateSearchIndexFailed,
        error: ATLAS_SEARCH_SERVER_ERRORS[error] || error,
      });
      return;
    }
  };
};

const setError = (error: string | undefined): SetErrorAction => ({
  type: ActionTypes.SetError,
  error,
});

const fetchIndexes = (
  newStatus: SearchIndexesStatus
): IndexesThunkAction<Promise<void>> => {
  return async (dispatch, getState) => {
    const {
      isReadonlyView,
      isWritable,
      dataService,
      namespace,
      searchIndexes: { sortColumn, sortOrder, status },
    } = getState();

    if (isReadonlyView || !isWritable) {
      return;
    }

    if (!dataService || !dataService.isConnected()) {
      debug('warning: trying to load indexes but dataService is disconnected');
      return;
    }

    // If we are currently doing fetching indexes, we will
    // wait for that
    if (NOT_FETCHABLE_STATUSES.includes(status)) {
      return;
    }

    try {
      dispatch({ type: ActionTypes.SetStatus, status: newStatus });
      const indexes = await dataService.getSearchIndexes(namespace);
      dispatch(setSearchIndexes(_sortIndexes(indexes, sortColumn, sortOrder)));
    } catch (err) {
      // We do no set any error on poll or refresh and the
      // previous list of indexes is shown to the user.
      if (newStatus === 'FETCHING') {
        dispatch(setError((err as Error).message));
      } else {
        // If fetch fails for refresh or polling, set the status to READY again.
        dispatch({
          type: ActionTypes.SetStatus,
          status: SearchIndexesStatuses.READY,
        });
      }
    }
  };
};

export const refreshSearchIndexes = (): IndexesThunkAction<Promise<void>> => {
  return async (dispatch, getState) => {
    const { status } = getState().searchIndexes;

    // If we are in a READY state, then we have already fetched the data
    // and are refreshing the list.
    const newStatus: SearchIndexesStatus =
      status === SearchIndexesStatuses.READY
        ? SearchIndexesStatuses.REFRESHING
        : SearchIndexesStatuses.FETCHING;
    await dispatch(fetchIndexes(newStatus));
  };
};

export const pollSearchIndexes = (): IndexesThunkAction<void> => {
  return (dispatch) => {
    void dispatch(fetchIndexes(SearchIndexesStatuses.POLLING));
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
        'If you drop this index, all queries using it will no longer function.',
    });
    if (!isConfirmed) {
      return;
    }

    try {
      await dataService.dropSearchIndex(namespace, name);
      track('Index Dropped', {
        atlas_search: true,
      });
      openToast('search-index-delete-in-progress', {
        title: `Your index ${name} is being deleted.`,
        dismissible: true,
        timeout: 5000,
        variant: 'progress',
      });
      void dispatch(fetchIndexes(SearchIndexesStatuses.REFRESHING));
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

export const runAggregateSearchIndex = (
  name: string
): IndexesThunkAction<void> => {
  return function (_dispatch, getState, { globalAppRegistry }) {
    const {
      searchIndexes: { indexes },
      namespace,
    } = getState();
    const searchIndex = indexes.find((x) => x.name === name);
    if (!searchIndex) {
      return;
    }
    globalAppRegistry?.emit('search-indexes-run-aggregate', {
      ns: namespace,
      pipelineText: JSON.stringify([
        {
          $search: {
            index: name,
            text: {
              query: 'string',
              path: 'string',
            },
          },
        },
      ]),
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
