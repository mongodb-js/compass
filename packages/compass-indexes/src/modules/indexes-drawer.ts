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
  CreateSearchIndexSucceededAction,
  refreshSearchIndexes,
  startPollingSearchIndexes,
  stopPollingSearchIndexes,
  UpdateSearchIndexSucceededAction,
} from './search-indexes';
import type {
  CreateSearchIndexClosedAction,
  UpdateSearchIndexClosedAction,
} from './search-indexes';
import type { FetchSearchIndexesActions } from './search-indexes';
import { showConfirmation } from '@mongodb-js/compass-components';
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

/**
 * Helper to check if view change should be allowed when there are unsaved changes.
 * Returns true if allowed, false if user cancelled.
 */
const confirmViewChangeIfDirty = async (isDirty: boolean): Promise<boolean> => {
  if (!isDirty) {
    return true;
  }

  return await showConfirmation({
    title: 'Any unsaved progress will be lost',
    buttonText: 'Discard',
    variant: 'danger',
    description: 'Are you sure you want to continue?',
  });
};

export const openIndexesListDrawerView = (): IndexesThunkAction<
  Promise<void>,
  OpenIndexesListDrawerViewAction | SetIsDirtyIndexDrawerAction
> => {
  return async (dispatch, getState) => {
    const { isDirty } = getState().indexesDrawer;
    const confirmed = await confirmViewChangeIfDirty(isDirty);
    if (!confirmed) {
      return;
    }
    dispatch({ type: OPEN_INDEXES_LIST_DRAWER_VIEW });
  };
};

export const openCreateSearchIndexDrawerView = (
  currentIndexType: SearchIndexType
): IndexesThunkAction<
  Promise<void>,
  OpenCreateSearchIndexDrawerViewAction | SetIsDirtyIndexDrawerAction
> => {
  return async (dispatch, getState) => {
    const { isDirty } = getState().indexesDrawer;
    const confirmed = await confirmViewChangeIfDirty(isDirty);
    if (!confirmed) {
      return;
    }
    dispatch({ type: OPEN_CREATE_SEARCH_INDEX_DRAWER_VIEW, currentIndexType });
  };
};

export const openEditSearchIndexDrawerView = (
  currentIndexName: string
): IndexesThunkAction<
  Promise<void>,
  OpenEditSearchIndexDrawerViewAction | SetIsDirtyIndexDrawerAction
> => {
  return async (dispatch, getState) => {
    const { isDirty } = getState().indexesDrawer;
    const confirmed = await confirmViewChangeIfDirty(isDirty);
    if (!confirmed) {
      return;
    }
    dispatch({ type: OPEN_EDIT_SEARCH_INDEX_DRAWER_VIEW, currentIndexName });
  };
};

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
    isAction<CreateSearchIndexSucceededAction>(
      action,
      SearchIndexesActionTypes.CreateSearchIndexSucceeded
    )
  ) {
    return {
      ...state,
      isDirty: false,
    };
  }

  if (
    isAction<UpdateSearchIndexSucceededAction>(
      action,
      SearchIndexesActionTypes.UpdateSearchIndexSucceeded
    )
  ) {
    return {
      ...state,
      isDirty: false,
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
