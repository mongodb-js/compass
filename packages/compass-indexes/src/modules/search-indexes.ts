import type { AnyAction } from 'redux';
import { isAction } from './../utils/is-action';
import type { IndexesThunkAction } from '.';
import { openToast } from '@mongodb-js/compass-components';
import type { Document, MongoServerError } from 'mongodb';

const ATLAS_SEARCH_SERVER_ERRORS: Record<string, string> = {
  InvalidIndexSpecificationOption: 'Invalid index definition.',
  IndexAlreadyExists:
    'This index name is already in use. Please choose another one.',
};

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
  CreateSearchIndexStarted = 'indexes/search-indexes/CreateSearchIndexStarted',
  CreateSearchIndexFailed = 'indexes/search-indexes/CreateSearchIndexFailed',
  CreateSearchIndexSucceeded = 'indexes/search-indexes/CreateSearchIndexSucceed',
  CreateSearchIndexCancelled = 'indexes/search-indexes/CreateSearchIndexCancelled',
}

type SetStatusAction = {
  type: ActionTypes.SetStatus;
  status: SearchIndexesStatus;
};

type OpenCreateSearchIndexModalAction = {
  type: ActionTypes.OpenCreateSearchIndexModal;
};

type CreateSearchIndexStartedAction = {
  type: ActionTypes.CreateSearchIndexStarted;
};

type CreateSearchIndexFailedAction = {
  type: ActionTypes.CreateSearchIndexFailed;
  error: string;
};

type CreateSearchIndexSucceededAction = {
  type: ActionTypes.CreateSearchIndexSucceeded;
};

type CreateSearchIndexCancelledAction = {
  type: ActionTypes.CreateSearchIndexCancelled;
};

type CreateSearchIndexState = {
  isModalOpen: boolean;
  isBusy: boolean;
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
    isBusy: false,
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
        isBusy: false,
      },
    };
  } else if (
    isAction<CreateSearchIndexCancelledAction>(
      action,
      ActionTypes.CreateSearchIndexCancelled
    )
  ) {
    return {
      ...state,
      error: undefined,
      createIndex: {
        ...state.createIndex,
        isModalOpen: false,
        isBusy: false,
      },
    };
  } else if (
    isAction<CreateSearchIndexStartedAction>(
      action,
      ActionTypes.CreateSearchIndexStarted
    )
  ) {
    return {
      ...state,
      error: undefined,
      createIndex: {
        ...state.createIndex,
        isBusy: true,
      },
    };
  } else if (
    isAction<CreateSearchIndexFailedAction>(
      action,
      ActionTypes.CreateSearchIndexFailed
    )
  ) {
    return {
      ...state,
      error: action.error,
      createIndex: {
        ...state.createIndex,
        isBusy: false,
      },
    };
  } else if (
    isAction<CreateSearchIndexSucceededAction>(
      action,
      ActionTypes.CreateSearchIndexSucceeded
    )
  ) {
    return {
      ...state,
      error: undefined,
      createIndex: {
        ...state.createIndex,
        isModalOpen: false,
        isBusy: false,
      },
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

export const closeModal = (): CreateSearchIndexCancelledAction => ({
  type: ActionTypes.CreateSearchIndexCancelled,
});

export const createIndexStarted = (): CreateSearchIndexStartedAction => ({
  type: ActionTypes.CreateSearchIndexStarted,
});

export const createIndexFailed = (
  error: string
): CreateSearchIndexFailedAction => ({
  type: ActionTypes.CreateSearchIndexFailed,
  error: ATLAS_SEARCH_SERVER_ERRORS[error] || error,
});

export const createIndexSucceeded = (): CreateSearchIndexSucceededAction => ({
  type: ActionTypes.CreateSearchIndexSucceeded,
});

export const saveIndex = (
  indexName: string,
  indexDefinition: Document
): IndexesThunkAction<Promise<void>> => {
  return async function (dispatch, getState) {
    const { namespace, dataService } = getState();

    dispatch(createIndexStarted());

    if (indexName === '') {
      dispatch(createIndexFailed('Please enter the name of the index.'));
      return;
    }

    try {
      await dataService?.createSearchIndex(
        namespace,
        indexName,
        indexDefinition
      );
    } catch (ex) {
      dispatch(
        createIndexFailed(
          (ex as MongoServerError).codeName || (ex as Error).message
        )
      );
      return;
    }

    dispatch(createIndexSucceeded());
    openToast('index-creation-in-progress', {
      title: `Your index ${indexName} is in progress.`,
      dismissible: true,
      timeout: 5000,
      variant: 'success',
    });
  };
};
