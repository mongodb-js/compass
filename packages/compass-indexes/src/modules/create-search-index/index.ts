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
  isUpdate: boolean;
  indexName: string;
};

export enum ActionTypes {
  OpenCreateSearchIndexModal = 'indexes/search-indexes/OpenCreateSearchIndexModal',
  OpenUpdateSearchIndexModal = 'indexes/search-indexes/OpenUpdateSearchIndexModal',
  CloseCrudSearchIndexModal = 'indexes/search-indexes/CloseCrudSearchIndexModal',
  IndexNameIsEmpty = 'indexes/search-indexes/IndexNameIsEmpty',
  IndexAlreadyExists = 'indexes/search-indexes/IndexAlreadyExists',
}

type OpenCreateSearchIndexModalAction = {
  type: ActionTypes.OpenCreateSearchIndexModal;
};

type OpenUpdateSearchIndexModalAction = {
  type: ActionTypes.OpenUpdateSearchIndexModal;
  indexName: string;
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

export const INITIAL_STATE: CreateSearchIndexState = {
  isModalOpen: false,
  error: undefined,
  isUpdate: false,
  indexName: '',
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
      error: undefined,
      isModalOpen: true,
      isUpdate: false,
      indexName: 'default',
    };
  }
  if (
    isAction<OpenUpdateSearchIndexModalAction>(
      action,
      ActionTypes.OpenUpdateSearchIndexModal
    )
  ) {
    return {
      ...state,
      error: undefined,
      isModalOpen: true,
      isUpdate: true,
      indexName: action.indexName,
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

export const openModalForCreation = (): OpenCreateSearchIndexModalAction => ({
  type: ActionTypes.OpenCreateSearchIndexModal,
});

export const openModalForUpdate = (
  indexName: string
): OpenUpdateSearchIndexModalAction => ({
  type: ActionTypes.OpenUpdateSearchIndexModal,
  indexName,
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
): ThunkAction<Promise<void>, CreateSearchIndexState, void, AnyAction> => {
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
