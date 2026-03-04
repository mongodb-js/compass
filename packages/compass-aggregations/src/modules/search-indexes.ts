import type { Action, Reducer } from 'redux';
import type { PipelineBuilderThunkAction } from '.';
import type { SearchIndex } from 'mongodb-data-service';
import { isAction } from '../utils/is-action';

const SearchIndexesStatuses = {
  INITIAL: 'INITIAL',
  LOADING: 'LOADING',
  POLLING: 'POLLING',
  READY: 'READY',
  ERROR: 'ERROR',
} as const;

export type SearchIndexesStatus = keyof typeof SearchIndexesStatuses;

const FetchReasons = {
  INITIAL_FETCH: 'INITIAL_FETCH',
  POLL: 'POLL',
} as const;

type FetchReason = (typeof FetchReasons)[keyof typeof FetchReasons];

// Statuses that indicate we should not start a new fetch
const NOT_FETCHABLE_STATUSES: SearchIndexesStatus[] = [
  SearchIndexesStatuses.LOADING,
  SearchIndexesStatuses.POLLING,
];

export const ActionTypes = {
  FetchIndexesStarted:
    'compass-aggregations/search-indexes/FetchIndexesStarted',
  FetchIndexesFinished:
    'compass-aggregations/search-indexes/FetchIndexesFinished',
  FetchIndexesFailed: 'compass-aggregations/search-indexes/FetchIndexesFailed',
} as const;

type FetchIndexesStartedAction = {
  type: typeof ActionTypes.FetchIndexesStarted;
  reason: FetchReason;
};

type FetchIndexesFinishedAction = {
  type: typeof ActionTypes.FetchIndexesFinished;
  indexes: SearchIndex[];
};

type FetchIndexesFailedAction = {
  type: typeof ActionTypes.FetchIndexesFailed;
};

export type SearchIndexesAction =
  | FetchIndexesFailedAction
  | FetchIndexesStartedAction
  | FetchIndexesFinishedAction;

type State = {
  isSearchIndexesSupported: boolean;
  indexes: SearchIndex[];
  status: SearchIndexesStatus;
};

export const INITIAL_STATE: State = {
  isSearchIndexesSupported: false,
  indexes: [],
  status: SearchIndexesStatuses.INITIAL,
};

const reducer: Reducer<State, Action> = (state = INITIAL_STATE, action) => {
  if (
    isAction<FetchIndexesStartedAction>(action, ActionTypes.FetchIndexesStarted)
  ) {
    return {
      ...state,
      status:
        action.reason === FetchReasons.POLL
          ? SearchIndexesStatuses.POLLING
          : SearchIndexesStatuses.LOADING,
    };
  }
  if (
    isAction<FetchIndexesFinishedAction>(
      action,
      ActionTypes.FetchIndexesFinished
    )
  ) {
    return {
      ...state,
      indexes: action.indexes,
      status: SearchIndexesStatuses.READY,
    };
  }
  if (
    isAction<FetchIndexesFailedAction>(action, ActionTypes.FetchIndexesFailed)
  ) {
    // If fetch fails for polling, set the status to READY again
    // and keep the previous list of indexes.
    return {
      ...state,
      status:
        state.status === SearchIndexesStatuses.LOADING
          ? SearchIndexesStatuses.ERROR
          : SearchIndexesStatuses.READY,
    };
  }
  return state;
};

export const POLLING_INTERVAL = 5000;

const fetchIndexesInternal = (
  reason: FetchReason
): PipelineBuilderThunkAction<Promise<void>> => {
  return async (dispatch, getState) => {
    const {
      namespace,
      dataService: { dataService },
      searchIndexes: { status },
    } = getState();

    if (!dataService) {
      return;
    }

    // If we are already fetching indexes, we will wait for that
    if (NOT_FETCHABLE_STATUSES.includes(status)) {
      return;
    }

    // For initial fetch, don't re-fetch if already ready
    if (
      reason === FetchReasons.INITIAL_FETCH &&
      status === SearchIndexesStatuses.READY
    ) {
      return;
    }

    dispatch({
      type: ActionTypes.FetchIndexesStarted,
      reason,
    });

    try {
      if (!dataService.getSearchIndexes) {
        throw new Error('Cannot get search indexes in this environment');
      }
      const indexes = await dataService.getSearchIndexes(namespace);
      dispatch({
        type: ActionTypes.FetchIndexesFinished,
        indexes,
      });
    } catch {
      dispatch({
        type: ActionTypes.FetchIndexesFailed,
      });
    }
  };
};

export const fetchIndexes = (): PipelineBuilderThunkAction<Promise<void>> => {
  return async (dispatch) => {
    await dispatch(fetchIndexesInternal(FetchReasons.INITIAL_FETCH));
  };
};

export const pollSearchIndexes = (): PipelineBuilderThunkAction<
  Promise<void>
> => {
  return async (dispatch) => {
    await dispatch(fetchIndexesInternal(FetchReasons.POLL));
  };
};

export const startPollingSearchIndexes =
  (): PipelineBuilderThunkAction<void> => {
    return (dispatch, _getState, { pollingIntervalRef }) => {
      if (pollingIntervalRef.searchIndexes !== null) {
        return;
      }
      pollingIntervalRef.searchIndexes = setInterval(() => {
        void dispatch(pollSearchIndexes());
      }, POLLING_INTERVAL);
    };
  };

export const stopPollingSearchIndexes =
  (): PipelineBuilderThunkAction<void> => {
    return (_dispatch, _getState, { pollingIntervalRef }) => {
      if (pollingIntervalRef.searchIndexes === null) {
        return;
      }
      clearInterval(pollingIntervalRef.searchIndexes);
      pollingIntervalRef.searchIndexes = null;
    };
  };

export const createSearchIndex = (): PipelineBuilderThunkAction<void> => {
  return (_dispatch, _getState, { localAppRegistry }) => {
    localAppRegistry.emit('open-create-search-index-modal');
  };
};

export const openIndexesListDrawerView =
  (): PipelineBuilderThunkAction<void> => {
    return (_dispatch, _getState, { localAppRegistry }) => {
      localAppRegistry.emit('open-indexes-list-drawer-view');
    };
  };

/**
 * Checks whether a namespace has existing search indexes
 *
 * @param namespace - collection/view namespace
 * @param dataService - dataService instance
 * @returns whether namespace has existing search indexes
 */
export const namespaceHasSearchIndexes = async (
  namespace: string,
  dataService: { getSearchIndexes?: (ns: string) => Promise<SearchIndex[]> }
): Promise<boolean> => {
  try {
    if (!dataService.getSearchIndexes) {
      throw new Error('Cannot get search indexes in this environment');
    }
    const indexes = await dataService.getSearchIndexes(namespace);
    return indexes.length > 0;
  } catch {
    return false;
  }
};

export default reducer;
