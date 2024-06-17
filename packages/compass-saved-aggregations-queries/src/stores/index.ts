import type AppRegistry from 'hadron-app-registry';
import { createStore, applyMiddleware, combineReducers } from 'redux';
import type { AnyAction, Action } from 'redux';
import thunk from 'redux-thunk';
import type { ThunkAction } from 'redux-thunk';
import itemsReducer from './aggregations-queries-items';
import openItemReducer from './open-item';
import editItemReducer from './edit-item';
import { type ConnectionsManager } from '@mongodb-js/compass-connections/provider';
import type { MongoDBInstancesManager } from '@mongodb-js/compass-app-stores/provider';
import type { Logger } from '@mongodb-js/compass-logging/provider';
import type { workspacesServiceLocator } from '@mongodb-js/compass-workspaces/provider';
import type {
  FavoriteQueryStorageAccess,
  PipelineStorage,
  FavoriteQueryStorage,
} from '@mongodb-js/my-queries-storage/provider';
import type { PreferencesAccess } from 'compass-preferences-model';

type MyQueriesServices = {
  connectionsManager: ConnectionsManager;
  instancesManager: MongoDBInstancesManager;
  preferencesAccess: PreferencesAccess;
  globalAppRegistry: AppRegistry;
  logger: Logger;
  pipelineStorage?: PipelineStorage;
  workspaces: ReturnType<typeof workspacesServiceLocator>;
  favoriteQueryStorageAccess?: FavoriteQueryStorageAccess;
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
  services: MyQueriesServices
) {
  const store = configureStore(services);
  return {
    store,
    deactivate() {
      // noop, no subscriptions in this plugin
    },
  };
}
