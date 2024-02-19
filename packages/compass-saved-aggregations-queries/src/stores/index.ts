import type AppRegistry from 'hadron-app-registry';
import { createStore, applyMiddleware, combineReducers } from 'redux';
import type { AnyAction, Action } from 'redux';
import thunk from 'redux-thunk';
import type { ThunkAction } from 'redux-thunk';
import itemsReducer from './aggregations-queries-items';
import openItemReducer from './open-item';
import editItemReducer from './edit-item';
import type { DataService } from 'mongodb-data-service';
import type { MongoDBInstance } from '@mongodb-js/compass-app-stores/provider';
import type { LoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';
import type { workspacesServiceLocator } from '@mongodb-js/compass-workspaces/provider';
import type {
  FavoriteQueryStorageAccess,
  PipelineStorage,
  FavoriteQueryStorage,
} from '@mongodb-js/my-queries-storage/provider';

type MyQueriesServices = {
  dataService: DataService;
  instance: MongoDBInstance;
  globalAppRegistry: AppRegistry;
  logger: LoggerAndTelemetry;
  pipelineStorage?: PipelineStorage;
  workspaces: ReturnType<typeof workspacesServiceLocator>;
  favoriteQueryStorageAccess?: FavoriteQueryStorageAccess;
};

export function configureStore({
  globalAppRegistry,
  dataService,
  instance,
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
        dataService,
        instance,
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
