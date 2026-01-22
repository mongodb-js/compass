import type { AnyAction } from 'redux';

export type IndexesDrawerTab =
  | 'indexes-list'
  | 'create-search-index'
  | 'edit-search-index';

export type SearchIndexType = 'search' | 'vectorSearch';

export type State = {
  currentTab: IndexesDrawerTab;
  currentIndexType: SearchIndexType | null;
  currentIndexName: string | null;
};

export const INITIAL_STATE: State = {
  currentTab: 'indexes-list',
  currentIndexType: null,
  currentIndexName: null,
};

// Action types
export const OPEN_INDEXES_LIST_DRAWER_TAB =
  'indexes/drawer/OPEN_INDEXES_LIST_DRAWER_TAB' as const;
export const OPEN_CREATE_SEARCH_INDEX_DRAWER_TAB =
  'indexes/drawer/OPEN_CREATE_SEARCH_INDEX_DRAWER_TAB' as const;
export const OPEN_EDIT_SEARCH_INDEX_DRAWER_TAB =
  'indexes/drawer/OPEN_EDIT_SEARCH_INDEX_DRAWER_TAB' as const;

// Action creators
export const openIndexesListPage = () => ({
  type: OPEN_INDEXES_LIST_DRAWER_TAB,
});

export const openCreateSearchIndexPage = (
  currentIndexType: SearchIndexType
) => ({
  type: OPEN_CREATE_SEARCH_INDEX_DRAWER_TAB,
  currentIndexType,
});

export const openEditSearchIndexPage = (currentIndexName: string) => ({
  type: OPEN_EDIT_SEARCH_INDEX_DRAWER_TAB,
  currentIndexName,
});

// Reducer
export default function reducer(
  state = INITIAL_STATE,
  action: AnyAction
): State {
  switch (action.type) {
    case OPEN_INDEXES_LIST_DRAWER_TAB:
      return {
        ...state,
        currentTab: 'indexes-list',
      };
    case OPEN_CREATE_SEARCH_INDEX_DRAWER_TAB:
      return {
        ...state,
        currentTab: 'create-search-index',
        currentIndexType: action.currentIndexType,
      };
    case OPEN_EDIT_SEARCH_INDEX_DRAWER_TAB:
      return {
        ...state,
        currentTab: 'edit-search-index',
        currentIndexName: action.currentIndexName,
      };
    default:
      return state;
  }
}
