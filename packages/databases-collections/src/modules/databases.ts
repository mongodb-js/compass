import type { Action, AnyAction, Reducer } from 'redux';
import type { MongoDBInstance } from '@mongodb-js/compass-app-stores/provider';
import type { ThunkAction } from 'redux-thunk';
import type AppRegistry from 'hadron-app-registry';
import { isAction } from '@mongodb-js/compass-utils';

export type Database = MongoDBInstance['databases'] extends Array<infer Db>
  ? Db
  : never;

export type DatabasesState = {
  databases: ReturnType<Database['toJSON']>[];
  databasesLoadingStatus: {
    status: string;
    error: string | null;
  };
  instance: {
    isWritable: boolean;
    isGenuineMongoDB: boolean;
    isDataLake: boolean;
  };
};

type DatabasesThunkAction<R, A extends Action = AnyAction> = ThunkAction<
  R,
  DatabasesState,
  { globalAppRegistry: AppRegistry },
  A
>;

const INITIAL_STATE = {
  databases: [],
  databasesLoadingStatus: {
    status: 'initial',
    error: null,
  },
  instance: {
    isReadonly: false,
    isWritable: true,
    isGenuineMongoDB: true,
    isDataLake: false,
  },
};

const reducer: Reducer<DatabasesState, Action> = (
  state = INITIAL_STATE,
  action
) => {
  if (isAction<InstanceChangedAction>(action, INSTANCE_CHANGED)) {
    return {
      ...state,
      instance: {
        isWritable: action.isWritable,
        isDataLake: action.isDataLake,
        isGenuineMongoDB: action.isGenuineMongoDB,
      },
    };
  }
  if (isAction<DatabasesChangedAction>(action, DATABASES_CHANGED)) {
    return {
      ...state,
      databases: action.databases,
      databasesLoadingStatus: {
        status: action.status,
        error: action.error,
      },
    };
  }
  return state;
};

const INSTANCE_CHANGED = 'databases-workspace/instance-changed' as const;
interface InstanceChangedAction {
  type: typeof INSTANCE_CHANGED;
  isWritable: boolean;
  isDataLake: boolean;
  isGenuineMongoDB: boolean;
}

export const instanceChanged = (
  instance: MongoDBInstance
): InstanceChangedAction => {
  return {
    type: INSTANCE_CHANGED,
    isWritable: instance.isWritable,
    isDataLake: instance.dataLake.isDataLake,
    isGenuineMongoDB: instance.genuineMongoDB.isGenuine,
  };
};

const DATABASES_CHANGED = 'databases-workspaces/databases-changed' as const;
interface DatabasesChangedAction {
  type: typeof DATABASES_CHANGED;
  status: string;
  error: string | null;
  databases: ReturnType<Database['toJSON']>[];
}

export const databasesChanged = (
  instance: MongoDBInstance
): DatabasesChangedAction => ({
  type: DATABASES_CHANGED,
  status: instance.databasesStatus,
  error: instance.databasesStatusError,
  databases: instance.databases.toJSON(),
});

export const refreshDatabases = (
  connectionId: string
): DatabasesThunkAction<void> => {
  return (_dispatch, _getState, { globalAppRegistry }) => {
    globalAppRegistry.emit('refresh-databases', { connectionId });
  };
};

export const createDatabase = (
  connectionId: string
): DatabasesThunkAction<void> => {
  return (_dispatch, _getState, { globalAppRegistry }) => {
    globalAppRegistry.emit('open-create-database', { connectionId });
  };
};

export const dropDatabase = (
  connectionId: string,
  ns: string
): DatabasesThunkAction<void> => {
  return (_dispatch, _getState, { globalAppRegistry }) => {
    globalAppRegistry.emit('open-drop-database', ns, { connectionId });
  };
};

export default reducer;
