import type { AnyAction } from 'redux';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { isAction } from './../utils/is-action';
import type { IndexesThunkAction } from '.';

import type { SearchIndex } from 'mongodb-data-service';

const { debug } = createLoggerAndTelemetry('COMPASS-INDEXES');

export type SearchSortColumn = keyof typeof sortColumnToProps;
export type SortDirection = 'asc' | 'desc';
type SortField = keyof Pick<SearchIndex, 'name' | 'status'>;

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

type SearchIndexesStatus = keyof typeof SearchIndexesStatuses;

export enum ActionTypes {
  SetIsRefreshing = 'indexes/search-indexes/SetIsRefreshing',

  SetSearchIndexes = 'indexes/search-indexes/SetSearchIndexes',
  SearchIndexesSorted = 'indexes/search-indexes/SearchIndexesSorted',

  SetError = 'indexes/search-indexes/SetError',
}

type SetIsRefreshingAction = {
  type: ActionTypes.SetIsRefreshing;
};

type SetSearchIndexesAction = {
  type: ActionTypes.SetSearchIndexes;
  searchIndexes: SearchIndex[];
};

type SearchIndexesSortedAction = {
  type: ActionTypes.SearchIndexesSorted;
  searchIndexes: SearchIndex[];
  sortOrder: SortDirection;
  sortColumn: SearchSortColumn;
};

type SetErrorAction = {
  type: ActionTypes.SetError;
  error: string | null;
};

type SearchIndexesActions =
  | SetIsRefreshingAction
  | SetSearchIndexesAction
  | SearchIndexesSortedAction
  | SetErrorAction;

export type State = {
  status: SearchIndexesStatus;
  searchIndexes: SearchIndex[];
  sortOrder: SortDirection;
  sortColumn: SearchSortColumn;
  error: string | null;
};

export const INITIAL_STATE: State = {
  status: 'NOT_AVAILABLE',
  searchIndexes: [],
  sortOrder: 'asc',
  sortColumn: 'Name and Fields',
  error: null,
};

export default function reducer(
  state = INITIAL_STATE,
  action: AnyAction
): State {
  if (isAction<SetIsRefreshingAction>(action, ActionTypes.SetIsRefreshing)) {
    return {
      ...state,
      status: 'REFRESHING',
    };
  }

  if (isAction<SetSearchIndexesAction>(action, ActionTypes.SetSearchIndexes)) {
    return {
      ...state,
      searchIndexes: action.searchIndexes,
      status: 'READY',
    };
  }

  if (
    isAction<SearchIndexesSortedAction>(action, ActionTypes.SearchIndexesSorted)
  ) {
    return {
      ...state,
      searchIndexes: action.searchIndexes,
      sortOrder: action.sortOrder,
      sortColumn: action.sortColumn,
    };
  }

  if (isAction<SetErrorAction>(action, ActionTypes.SetError)) {
    return {
      ...state,
      searchIndexes: [],
      error: action.error,
      status: 'ERROR',
    };
  }

  return state;
}

const setSearchIndexes = (
  searchIndexes: SearchIndex[]
): SetSearchIndexesAction => ({
  type: ActionTypes.SetSearchIndexes,
  searchIndexes,
});

const setError = (error: string | null): SetErrorAction => ({
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
      // TODO: should we just leave the status at pending?
      return;
    }

    if (status !== 'PENDING') {
      // 2nd time onwards set the status to refreshing
      dispatch(setIsRefreshing());
    }

    if (!dataService || !dataService.isConnected()) {
      debug('warning: trying to load indexes but dataService is disconnected');
      return;
    }

    try {
      dispatch(setError(null));
      const indexes = await dataService.getSearchIndexes(namespace);
      indexes.sort(_getSortFunction(_mapColumnToProp(sortColumn), sortOrder));
      dispatch(setSearchIndexes(indexes));
    } catch (err) {
      dispatch(setError((err as Error).message));
    }
  };
};

export const sortSearchIndexes = (
  column: SearchSortColumn,
  order: SortDirection
): IndexesThunkAction<void, SearchIndexesSortedAction> => {
  return (dispatch, getState) => {
    const {
      searchIndexes: { searchIndexes },
    } = getState();

    const sortedIndexes = [...searchIndexes].sort(
      _getSortFunction(_mapColumnToProp(column), order)
    );

    dispatch({
      type: ActionTypes.SearchIndexesSorted,
      searchIndexes: sortedIndexes,
      sortOrder: order,
      sortColumn: column,
    });
  };
};

const _getSortFunction = (field: SortField, sortOrder: SortDirection) => {
  const order = sortOrder === 'asc' ? 1 : -1;
  return function (a: SearchIndex, b: SearchIndex) {
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
  };
};

const _mapColumnToProp = (column: SearchSortColumn): SortField => {
  return sortColumnToProps[column];
};
