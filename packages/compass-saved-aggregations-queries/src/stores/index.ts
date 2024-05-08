import type AppRegistry from 'hadron-app-registry';
import { createStore, applyMiddleware, combineReducers } from 'redux';
import type { AnyAction, Action } from 'redux';
import thunk from 'redux-thunk';
import type { ThunkAction } from 'redux-thunk';
import itemsReducer from './aggregations-queries-items';
import openItemReducer, {
  connectionConnected,
  connectionDisconnected,
} from './open-item';
import editItemReducer from './edit-item';
import {
  ConnectionsManagerEvents,
  type ConnectionInfoAccess,
  type ConnectionsManager,
} from '@mongodb-js/compass-connections/provider';
import type { MongoDBInstancesManager } from '@mongodb-js/compass-app-stores/provider';
import type { LoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';
import type { workspacesServiceLocator } from '@mongodb-js/compass-workspaces/provider';
import type {
  FavoriteQueryStorageAccess,
  PipelineStorage,
  FavoriteQueryStorage,
} from '@mongodb-js/my-queries-storage/provider';
import type { ActivateHelpers } from 'hadron-app-registry';
import type { PreferencesAccess } from 'compass-preferences-model';

type MyQueriesServices = {
  connectionsManager: ConnectionsManager;
  instancesManager: MongoDBInstancesManager;
  preferencesAccess: PreferencesAccess;
  globalAppRegistry: AppRegistry;
  logger: LoggerAndTelemetry;
  pipelineStorage?: PipelineStorage;
  workspaces: ReturnType<typeof workspacesServiceLocator>;
  favoriteQueryStorageAccess?: FavoriteQueryStorageAccess;
  connectionInfoAccess: ConnectionInfoAccess;
};

export function configureStore({
  globalAppRegistry,
  connectionsManager,
  instancesManager,
  preferencesAccess,
  logger,
  workspaces,
  pipelineStorage,
  favoriteQueryStorageAccess,
  connectionInfoAccess,
}: MyQueriesServices) {
  return createStore(
    combineReducers({
      savedItems: itemsReducer,
      openItem: openItemReducer,
      editItem: editItemReducer,
    }),
    applyMiddleware(
      thunk.withExtraArgument({
        globalAppRegistry,
        connectionsManager,
        instancesManager,
        preferencesAccess,
        logger,
        pipelineStorage,
        queryStorage: favoriteQueryStorageAccess?.getStorage(),
        workspaces,
        connectionInfoAccess,
      })
    )
  );
}

export type RootState = ReturnType<
  ReturnType<typeof configureStore>['getState']
>;

type SavedQueryAggregationExtraArgs = Omit<
  MyQueriesServices,
  'locateFavoriteQueryStorage'
> & {
  queryStorage?: FavoriteQueryStorage;
};

export type SavedQueryAggregationThunkAction<
  R,
  A extends Action = AnyAction
> = ThunkAction<R, RootState, SavedQueryAggregationExtraArgs, A>;

export function activatePlugin(
  _: Record<string, never>,
  services: MyQueriesServices,
  { on, cleanup }: ActivateHelpers
) {
  const store = configureStore(services);
  on(
    services.connectionsManager,
    ConnectionsManagerEvents.ConnectionAttemptSuccessful,
    function (connection: string) {
      store.dispatch(connectionConnected(connection));
    }
  );

  on(
    services.connectionsManager,
    ConnectionsManagerEvents.ConnectionDisconnected,
    function (connection: string) {
      store.dispatch(connectionDisconnected(connection));
    }
  );
  return {
    store,
    deactivate: cleanup,
  };
}
