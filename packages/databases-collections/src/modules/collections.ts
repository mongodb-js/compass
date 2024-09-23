import type Collection from 'mongodb-collection-model';
import type Database from 'mongodb-database-model';
import type { MongoDBInstance } from 'mongodb-instance-model';
import type { Action, AnyAction, Reducer } from 'redux';
import type { ThunkAction } from 'redux-thunk';
import type { CollectionsThunkExtraArg } from '../stores/collections-store';
import toNS from 'mongodb-ns';
import { isAction } from '@mongodb-js/compass-utils';

export type CollectionsState = {
  collections: ReturnType<Collection['toJSON']>[];
  collectionsLoadingStatus: {
    status: Database['collectionsStatus'];
    error: string | null;
  };
  instance: {
    isWritable: boolean;
    isDataLake: boolean;
  };
};

export type CollectionsThunkAction<
  R,
  A extends Action = AnyAction
> = ThunkAction<R, CollectionsState, CollectionsThunkExtraArg, A>;

const INITIAL_STATE = {
  collections: [],
  collectionsLoadingStatus: {
    status: 'initial' as const,
    error: null,
  },
  instance: {
    isWritable: false,
    isDataLake: false,
  },
};

const COLLECTIONS_CHANGED = 'compass-collections/COLLECTIONS_CHANGED' as const;
interface CollectionsChangedAction {
  type: typeof COLLECTIONS_CHANGED;
  status: Database['collectionsStatus'];
  error: string | null;
  collections: ReturnType<Collection['toJSON']>[];
}

export const collectionsChanged = (
  database: Database
): CollectionsChangedAction => {
  return {
    type: COLLECTIONS_CHANGED,
    status: database.collectionsStatus,
    error: database.collectionsStatusError,
    collections: database.collections.toJSON(),
  };
};

const INSTANCE_CHANGED = 'compass-collections/INSTANCE_CHANGED' as const;
interface InstanceChangedAction {
  type: typeof INSTANCE_CHANGED;
  isWritable: boolean;
  isDataLake: boolean;
}

export const instanceChanged = (
  instance: MongoDBInstance
): InstanceChangedAction => {
  return {
    type: INSTANCE_CHANGED,
    isWritable: instance.isWritable,
    isDataLake: instance.dataLake.isDataLake,
  };
};

const reducer: Reducer<CollectionsState, Action> = (
  state = INITIAL_STATE,
  action
) => {
  if (isAction<CollectionsChangedAction>(action, COLLECTIONS_CHANGED)) {
    return {
      ...state,
      collections: action.collections,
      collectionsLoadingStatus:
        action.status === state.collectionsLoadingStatus.status
          ? state.collectionsLoadingStatus
          : { status: action.status, error: action.error },
    };
  }
  if (isAction<InstanceChangedAction>(action, INSTANCE_CHANGED)) {
    return {
      ...state,
      instance: {
        isWritable: action.isWritable,
        isDataLake: action.isDataLake,
      },
    };
  }
  return state;
};

export const refreshCollections = (): CollectionsThunkAction<void> => {
  return (_dispatch, _getState, { database, dataService }) => {
    void database.fetchCollectionsDetails({ dataService, force: true });
  };
};

export const createNewCollection = (
  connectionId: string,
  dbName: string
): CollectionsThunkAction<void> => {
  return (_dispatch, _getState, { globalAppRegistry }) => {
    globalAppRegistry.emit('open-create-collection', toNS(dbName), {
      connectionId,
    });
  };
};

export const deleteCollection = (
  connectionId: string,
  namespace: string
): CollectionsThunkAction<void> => {
  return (_dispatch, _getState, { globalAppRegistry }) => {
    globalAppRegistry.emit('open-drop-collection', toNS(namespace), {
      connectionId,
    });
  };
};

export default reducer;
