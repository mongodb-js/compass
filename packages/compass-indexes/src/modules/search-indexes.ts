import type { AnyAction } from 'redux';
import { isAction } from './../utils/is-action';
import type { IndexesThunkAction } from '.';
import { openToast } from '@mongodb-js/compass-components';

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
}

type SearchIndexesStatus = keyof typeof SearchIndexesStatuses;

export type CreateSearchIndexError =
  | 'index-name-is-empty'
  | 'index-already-exists';

export enum ActionTypes {
  SetStatus = 'indexes/search-indexes/SetStatus',
  OpenCreateSearchIndexModal = 'indexes/search-indexes/OpenCreateSearchIndexModal',
  CloseCrudSearchIndexModal = 'indexes/search-indexes/CloseCrudSearchIndexModal',
  IndexNameIsEmpty = 'indexes/search-indexes/IndexNameIsEmpty',
  IndexAlreadyExists = 'indexes/search-indexes/IndexAlreadyExists',
}

type SetStatusAction = {
  type: ActionTypes.SetStatus;
  status: SearchIndexesStatus;
};

type OpenCreateSearchIndexModalAction = {
  type: ActionTypes.OpenCreateSearchIndexModal;
};

type CloseCrudSearchIndexModalAction = {
  type: ActionTypes.CloseCrudSearchIndexModal;
};

type IndexNameIsEmptyAction = {
  type: ActionTypes.IndexNameIsEmpty;
};

type IndexAlreadyExistsAction = {
  type: ActionTypes.IndexAlreadyExists;
};

export type State = {
  status: SearchIndexesStatus;
  isModalOpen: boolean; // false
  error?: string;
};

export const INITIAL_STATE: State = {
  status: 'NOT_AVAILABLE',
  isModalOpen: false,
  error: undefined,
};

export default function reducer(state = INITIAL_STATE, action: AnyAction) {
  if (isAction<SetStatusAction>(action, ActionTypes.SetStatus)) {
    return {
      ...state,
      status: action.status,
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
      isModalOpen: true,
    };
  } else if (
    isAction<CloseCrudSearchIndexModalAction>(
      action,
      ActionTypes.CloseCrudSearchIndexModal
    )
  ) {
    return {
      ...state,
      error: undefined,
      isModalOpen: false,
    };
  } else if (
    isAction<IndexAlreadyExistsAction>(action, ActionTypes.IndexAlreadyExists)
  ) {
    return {
      ...state,
      error: 'index-already-exists',
    };
  } else if (
    isAction<IndexNameIsEmptyAction>(action, ActionTypes.IndexNameIsEmpty)
  ) {
    return {
      ...state,
      error: 'index-name-is-empty',
    };
  }

  return state;
}

export const setStatus = (status: SearchIndexesStatus): SetStatusAction => ({
  type: ActionTypes.SetStatus,
  status,
});

export const openModalForCreation = (): OpenCreateSearchIndexModalAction => ({
  type: ActionTypes.OpenCreateSearchIndexModal,
});

export const closeModal = (): CloseCrudSearchIndexModalAction => ({
  type: ActionTypes.CloseCrudSearchIndexModal,
});

export const indexNameIsEmpty = (): IndexNameIsEmptyAction => ({
  type: ActionTypes.IndexNameIsEmpty,
});

export const indexAlreadyExists = (): IndexAlreadyExistsAction => ({
  type: ActionTypes.IndexAlreadyExists,
});

export const saveIndex = (
  indexName: string,
  indexDefinition: string
): IndexesThunkAction<Promise<void>> => {
  return async function (dispatch, getState) {
    const { namespace, dataService } = getState();

    if (indexName === '') {
      dispatch(indexNameIsEmpty());
      return;
    }

    if (false /* index already exists */) {
      dispatch(indexAlreadyExists());
      return;
    }

    dispatch(closeModal());
    openToast('index-creation-in-progress', {
      title: `Your index ${indexName} is in progress.`,
      dismissible: true,
      timeout: 5000,
      variant: 'success',
    });
  };
};
