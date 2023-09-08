import type { AnyAction } from 'redux';
import { isAction } from './../../utils/is-action';
import type { ThunkAction } from 'redux-thunk';
import { openToast } from '@mongodb-js/compass-components';

export type CreateSearchIndexError =
  | 'index-name-is-empty'
  | 'index-already-exists';

export type CreateSearchIndexState = {
  isModalOpen: boolean; // false
  error: CreateSearchIndexError | undefined;
};

export enum ActionTypes {
  OpenCreateSearchIndexModal = 'indexes/search-indexes/OpenCreateSearchIndexModal',
  CloseCreateSearchIndexModal = 'indexes/search-indexes/CloseCreateSearchIndexModal',
  IndexNameIsEmpty = 'indexes/search-indexes/IndexNameIsEmpty',
  IndexAlreadyExists = 'indexes/search-indexes/IndexAlreadyExists',
}

type OpenCreateSearchIndexModalAction = {
  type: ActionTypes.OpenCreateSearchIndexModal;
};

type CloseCreateSearchIndexModalAction = {
  type: ActionTypes.CloseCreateSearchIndexModal;
};

type IndexNameIsEmptyAction = {
  type: ActionTypes.IndexNameIsEmpty;
};

type IndexAlreadyExistsAction = {
  type: ActionTypes.IndexAlreadyExists;
};

export const INITIAL_STATE: CreateSearchIndexState = {
  isModalOpen: false,
  error: undefined,
};

export default function reducer(state = INITIAL_STATE, action: AnyAction) {
  if (
    isAction<OpenCreateSearchIndexModalAction>(
      action,
      ActionTypes.OpenCreateSearchIndexModal
    )
  ) {
    return {
      ...state,
      isModalOpen: true,
    };
  } else if (
    isAction<CloseCreateSearchIndexModalAction>(
      action,
      ActionTypes.CloseCreateSearchIndexModal
    )
  ) {
    return {
      ...state,
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

export const openModal = (): OpenCreateSearchIndexModalAction => ({
  type: ActionTypes.OpenCreateSearchIndexModal,
});

export const closeModal = (): CloseCreateSearchIndexModalAction => ({
  type: ActionTypes.CloseCreateSearchIndexModal,
});

export const indexNameIsEmpty = (): IndexNameIsEmptyAction => ({
  type: ActionTypes.IndexNameIsEmpty,
});

export const indexAlreadyExists = (): IndexAlreadyExistsAction => ({
  type: ActionTypes.IndexAlreadyExists,
});

export const createIndex = (
  indexName: string,
  indexDefinition: string
): ThunkAction<Promise<void>, CreateSearchIndexState, void, AnyAction> => {
  return async function (dispatch, getState) {
    const { dataService } = getState();

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
