import type { AnyAction } from 'redux';
import type { IndexesThunkAction } from './index';
import {
  refreshRegularIndexes,
  startPollingRegularIndexes,
  stopPollingRegularIndexes,
} from './regular-indexes';
import type { FetchIndexesActions } from './regular-indexes';
import {
  refreshSearchIndexes,
  startPollingSearchIndexes,
  stopPollingSearchIndexes,
} from './search-indexes';
import type { FetchSearchIndexesActions } from './search-indexes';
export type IndexesDrawerViewType =
  | 'indexes-list'
  | 'create-search-index'
  | 'edit-search-index';

export type SearchIndexType = 'search' | 'vectorSearch';

export type State = {
  currentView: IndexesDrawerViewType;
  currentIndexType: SearchIndexType | null;
  currentIndexName: string | null;
};

export const INITIAL_STATE: State = {
  currentView: 'indexes-list',
  currentIndexType: null,
  currentIndexName: null,
};

export const OPEN_INDEXES_LIST_DRAWER_VIEW =
  'indexes/drawer/OPEN_INDEXES_LIST_DRAWER_VIEW' as const;
export const OPEN_CREATE_SEARCH_INDEX_DRAWER_VIEW =
  'indexes/drawer/OPEN_CREATE_SEARCH_INDEX_DRAWER_VIEW' as const;
export const OPEN_EDIT_SEARCH_INDEX_DRAWER_VIEW =
  'indexes/drawer/OPEN_EDIT_SEARCH_INDEX_DRAWER_VIEW' as const;

export const openIndexesListDrawerView = () => ({
  type: OPEN_INDEXES_LIST_DRAWER_VIEW,
});

export const openCreateSearchIndexDrawerView = (
  currentIndexType: SearchIndexType
) => ({
  type: OPEN_CREATE_SEARCH_INDEX_DRAWER_VIEW,
  currentIndexType,
});

export const openEditSearchIndexDrawerView = (currentIndexName: string) => ({
  type: OPEN_EDIT_SEARCH_INDEX_DRAWER_VIEW,
  currentIndexName,
});

export const refreshAllIndexes = (): IndexesThunkAction<
  void,
  FetchSearchIndexesActions | FetchIndexesActions
> => {
  return (dispatch) => {
    void dispatch(refreshRegularIndexes());
    void dispatch(refreshSearchIndexes());
  };
};

export const startPollingAllIndexes = (): IndexesThunkAction<
  void,
  FetchSearchIndexesActions | FetchIndexesActions
> => {
  return (dispatch) => {
    dispatch(startPollingRegularIndexes());
    dispatch(startPollingSearchIndexes());
  };
};

export const stopPollingAllIndexes = (): IndexesThunkAction<void, never> => {
  return (dispatch) => {
    dispatch(stopPollingRegularIndexes());
    dispatch(stopPollingSearchIndexes());
  };
};

export default function reducer(
  state = INITIAL_STATE,
  action: AnyAction
): State {
  switch (action.type) {
    case OPEN_INDEXES_LIST_DRAWER_VIEW:
      return {
        ...state,
        currentView: 'indexes-list',
      };
    case OPEN_CREATE_SEARCH_INDEX_DRAWER_VIEW:
      return {
        ...state,
        currentView: 'create-search-index',
        currentIndexType: action.currentIndexType,
      };
    case OPEN_EDIT_SEARCH_INDEX_DRAWER_VIEW:
      return {
        ...state,
        currentView: 'edit-search-index',
        currentIndexName: action.currentIndexName,
      };
    default:
      return state;
  }
}
