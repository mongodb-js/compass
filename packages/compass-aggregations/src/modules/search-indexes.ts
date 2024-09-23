import type { Action, Reducer } from 'redux';
import type { PipelineBuilderThunkAction } from '.';
import type { SearchIndex } from 'mongodb-data-service';
import { isAction } from '../utils/is-action';

enum SearchIndexesStatuses {
  INITIAL = 'INITIAL',
  LOADING = 'LOADING',
  READY = 'READY',
  ERROR = 'ERROR',
}

export type SearchIndexesStatus = keyof typeof SearchIndexesStatuses;

export enum ActionTypes {
  FetchIndexesStarted = 'compass-aggregations/search-indexes/FetchIndexesStarted',
  FetchIndexesFinished = 'compass-aggregations/search-indexes/FetchIndexesFinished',
  FetchIndexesFailed = 'compass-aggregations/search-indexes/FetchIndexesFailed',
}

type FetchIndexesStartedAction = {
  type: ActionTypes.FetchIndexesStarted;
};

type FetchIndexesFinishedAction = {
  type: ActionTypes.FetchIndexesFinished;
  indexes: SearchIndex[];
};

type FetchIndexesFailedAction = {
  type: ActionTypes.FetchIndexesFailed;
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
      status: SearchIndexesStatuses.LOADING,
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
    return {
      ...state,
      status: SearchIndexesStatuses.ERROR,
    };
  }
  return state;
};

export const fetchIndexes = (): PipelineBuilderThunkAction<Promise<void>> => {
  return async (dispatch, getState) => {
    const {
      namespace,
      dataService: { dataService },
      searchIndexes: { status },
    } = getState();

    if (
      !dataService ||
      status === SearchIndexesStatuses.LOADING ||
      status === SearchIndexesStatuses.READY
    ) {
      return;
    }

    dispatch({
      type: ActionTypes.FetchIndexesStarted,
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
    } catch (e) {
      dispatch({
        type: ActionTypes.FetchIndexesFailed,
      });
    }
  };
};

export const createSearchIndex = (): PipelineBuilderThunkAction<void> => {
  return (_dispatch, _getState, { localAppRegistry }) => {
    localAppRegistry.emit('open-create-search-index-modal');
  };
};

export default reducer;
