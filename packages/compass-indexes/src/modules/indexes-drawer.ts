import type { AnyAction } from 'redux';
import type { IndexesThunkAction } from './index';
import { isAction } from '../utils/is-action';
import {
  refreshRegularIndexes,
  startPollingRegularIndexes,
  stopPollingRegularIndexes,
} from './regular-indexes';
import type { FetchIndexesActions } from './regular-indexes';
import {
  ActionTypes as SearchIndexesActionTypes,
  refreshSearchIndexes,
  startPollingSearchIndexes,
  stopPollingSearchIndexes,
} from './search-indexes';
import type {
  CreateSearchIndexClosedAction,
  UpdateSearchIndexClosedAction,
} from './search-indexes';
import type { FetchSearchIndexesActions } from './search-indexes';
export type IndexesDrawerViewType =
  | 'indexes-list'
  | 'create-search-index'
  | 'edit-search-index';

export type SearchIndexType = 'search' | 'vectorSearch';

export type State = {
  currentView: IndexesDrawerViewType;
  currentIndexType: SearchIndexType;
  currentIndexName: string;
  isDirty: boolean;
};

export const INITIAL_STATE: State = {
  currentView: 'indexes-list',
  currentIndexType: 'search',
  currentIndexName: '',
  isDirty: false,
};

export const OPEN_INDEXES_LIST_DRAWER_VIEW =
  'indexes/drawer/OPEN_INDEXES_LIST_DRAWER_VIEW' as const;
export const OPEN_CREATE_SEARCH_INDEX_DRAWER_VIEW =
  'indexes/drawer/OPEN_CREATE_SEARCH_INDEX_DRAWER_VIEW' as const;
export const OPEN_EDIT_SEARCH_INDEX_DRAWER_VIEW =
  'indexes/drawer/OPEN_EDIT_SEARCH_INDEX_DRAWER_VIEW' as const;
export const SET_IS_DIRTY = 'indexes/drawer/SET_IS_DIRTY' as const;

type OpenIndexesListDrawerViewAction = {
  type: typeof OPEN_INDEXES_LIST_DRAWER_VIEW;
};

type OpenCreateSearchIndexDrawerViewAction = {
  type: typeof OPEN_CREATE_SEARCH_INDEX_DRAWER_VIEW;
  currentIndexType: SearchIndexType;
};

type OpenEditSearchIndexDrawerViewAction = {
  type: typeof OPEN_EDIT_SEARCH_INDEX_DRAWER_VIEW;
  currentIndexName: string;
};

type SetIsDirtyIndexDrawerAction = {
  type: typeof SET_IS_DIRTY;
  isDirty: boolean;
};

export type IndexesDrawerActions =
  | OpenIndexesListDrawerViewAction
  | OpenCreateSearchIndexDrawerViewAction
  | OpenEditSearchIndexDrawerViewAction
  | SetIsDirtyIndexDrawerAction;

export const openIndexesListDrawerView =
  (): OpenIndexesListDrawerViewAction => ({
    type: OPEN_INDEXES_LIST_DRAWER_VIEW,
  });

export const openCreateSearchIndexDrawerView = (
  currentIndexType: SearchIndexType
): OpenCreateSearchIndexDrawerViewAction => ({
  type: OPEN_CREATE_SEARCH_INDEX_DRAWER_VIEW,
  currentIndexType,
});

export const openEditSearchIndexDrawerView = (
  currentIndexName: string
): OpenEditSearchIndexDrawerViewAction => ({
  type: OPEN_EDIT_SEARCH_INDEX_DRAWER_VIEW,
  currentIndexName,
});

export const setIsDirty = (isDirty: boolean): SetIsDirtyIndexDrawerAction => ({
  type: SET_IS_DIRTY,
  isDirty,
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
  if (
    isAction<OpenIndexesListDrawerViewAction>(
      action,
      OPEN_INDEXES_LIST_DRAWER_VIEW
    )
  ) {
    return {
      ...state,
      currentView: 'indexes-list',
    };
  }

  if (
    isAction<OpenCreateSearchIndexDrawerViewAction>(
      action,
      OPEN_CREATE_SEARCH_INDEX_DRAWER_VIEW
    )
  ) {
    return {
      ...state,
      currentView: 'create-search-index',
      currentIndexType: action.currentIndexType,
    };
  }

  if (
    isAction<OpenEditSearchIndexDrawerViewAction>(
      action,
      OPEN_EDIT_SEARCH_INDEX_DRAWER_VIEW
    )
  ) {
    return {
      ...state,
      currentView: 'edit-search-index',
      currentIndexName: action.currentIndexName,
    };
  }

  if (isAction<SetIsDirtyIndexDrawerAction>(action, SET_IS_DIRTY)) {
    return {
      ...state,
      isDirty: action.isDirty,
    };
  }

  if (
    isAction<CreateSearchIndexClosedAction>(
      action,
      SearchIndexesActionTypes.CreateSearchIndexClosed
    )
  ) {
    return {
      ...state,
      isDirty: false,
    };
  }

  if (
    isAction<UpdateSearchIndexClosedAction>(
      action,
      SearchIndexesActionTypes.UpdateSearchIndexClosed
    )
  ) {
    return {
      ...state,
      isDirty: false,
    };
  }

  return state;
}
