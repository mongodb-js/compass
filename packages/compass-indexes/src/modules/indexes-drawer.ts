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
  currentIndexType: SearchIndexType;
  currentIndexName: string;
  isEditing: boolean;
};

export const INITIAL_STATE: State = {
  currentView: 'indexes-list',
  currentIndexType: 'search',
  currentIndexName: '',
  isEditing: false,
};

export const OPEN_INDEXES_LIST_DRAWER_VIEW =
  'indexes/drawer/OPEN_INDEXES_LIST_DRAWER_VIEW' as const;
export const OPEN_CREATE_SEARCH_INDEX_DRAWER_VIEW =
  'indexes/drawer/OPEN_CREATE_SEARCH_INDEX_DRAWER_VIEW' as const;
export const OPEN_EDIT_SEARCH_INDEX_DRAWER_VIEW =
  'indexes/drawer/OPEN_EDIT_SEARCH_INDEX_DRAWER_VIEW' as const;
export const SET_IS_EDITING = 'indexes/drawer/SET_IS_EDITING' as const;

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

type SetIsEditingIndexDrawerAction = {
  type: typeof SET_IS_EDITING;
  isEditing: boolean;
};

export type IndexesDrawerActions =
  | OpenIndexesListDrawerViewAction
  | OpenCreateSearchIndexDrawerViewAction
  | OpenEditSearchIndexDrawerViewAction
  | SetIsEditingIndexDrawerAction;

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

export const setIsEditing = (
  isEditing: boolean
): SetIsEditingIndexDrawerAction => ({
  type: SET_IS_EDITING,
  isEditing,
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

  if (isAction<SetIsEditingIndexDrawerAction>(action, SET_IS_EDITING)) {
    return {
      ...state,
      isEditing: action.isEditing,
    };
  }

  return state;
}
