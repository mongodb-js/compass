import type { AnyAction } from 'redux';
import { isAction } from './../utils/is-action';
import type { IndexesThunkAction } from '.';
import { openToast } from '@mongodb-js/compass-components';
import type { Document, MongoServerError } from 'mongodb';

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

export enum ActionTypes {
  SetStatus = 'indexes/search-indexes/SetStatus',
  OpenCreateSearchIndexModal = 'indexes/search-indexes/OpenCreateSearchIndexModal',
  CloseCrudSearchIndexModal = 'indexes/search-indexes/CloseCrudSearchIndexModal',
  SetError = 'indexes/search-indexes/SearchError',
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

type SetErrorAction = {
  type: ActionTypes.SetError;
  error: string | undefined;
};

type CreateSearchIndexState = {
  isModalOpen: boolean; // false
};

export type State = {
  status: SearchIndexesStatus;
  createIndex: CreateSearchIndexState;
  error?: string;
  indexes: any[];
};

export const INITIAL_STATE: State = {
  status: 'NOT_AVAILABLE',
  createIndex: {
    isModalOpen: false,
  },
  error: undefined,
  indexes: [],
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
      createIndex: {
        ...state.createIndex,
        isModalOpen: true,
      },
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
      createIndex: {
        ...state.createIndex,
        isModalOpen: false,
      },
    };
  } else if (isAction<SetErrorAction>(action, ActionTypes.SetError)) {
    return {
      ...state,
      error: action.error,
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

export const setError = (error: string | undefined): SetErrorAction => ({
  type: ActionTypes.SetError,
  error,
});

export const saveIndex = (
  indexName: string,
  indexDefinition: Document
): IndexesThunkAction<Promise<void>> => {
  return async function (dispatch, getState) {
    const { namespace, dataService } = getState();

    dispatch(setError(undefined));
    if (indexName === '') {
      dispatch(setError('Please enter the name of the index.'));
      return;
    }

    try {
      await dataService?.createSearchIndex(
        namespace,
        indexName,
        indexDefinition
      );
    } catch (ex) {
      dispatch(setError((ex as MongoServerError).codeName));
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
