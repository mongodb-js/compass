import type AppRegistry from 'hadron-app-registry';
import { createStore, applyMiddleware, combineReducers } from 'redux';
import type { AnyAction, Action } from 'redux';
import thunk from 'redux-thunk';
import type { ThunkAction } from 'redux-thunk';
import itemsReducer from './aggregations-queries-items';
import openItemReducer from './open-item';
import editItemReducer from './edit-item';
import { FavoriteQueryStorage } from '@mongodb-js/my-queries-storage';
import { PipelineStorage } from '@mongodb-js/my-queries-storage';
import type { DataService } from 'mongodb-data-service';
import type { MongoDBInstance } from '@mongodb-js/compass-app-stores/provider';
import type { LoggerAndTelemetry } from '@mongodb-js/compass-logging';

type MyQueriesServices = {
  dataService: DataService;
  instance: MongoDBInstance;
  globalAppRegistry: AppRegistry;
  logger: LoggerAndTelemetry;
};

// TODO(COMPASS-7411): should also be service injected, this type will merge
// with the one above
type Storages = {
  pipelineStorage: PipelineStorage;
  queryStorage: FavoriteQueryStorage;
};

export function configureStore({
  globalAppRegistry,
  dataService,
  instance,
  logger,
  pipelineStorage = new PipelineStorage(),
  queryStorage = new FavoriteQueryStorage(),
}: MyQueriesServices & Partial<Storages>) {
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
        queryStorage,
      })
    )
  );
}

export type RootState = ReturnType<
  ReturnType<typeof configureStore>['getState']
>;

type SavedQueryAggregationExtraArgs = MyQueriesServices & Storages;

export type SavedQueryAggregationThunkAction<
  R,
  A extends Action = AnyAction
> = ThunkAction<R, RootState, SavedQueryAggregationExtraArgs, A>;

export function activatePlugin(
  _: Record<string, never>,
  services: MyQueriesServices & Partial<Storages>
) {
  const store = configureStore(services);
  return {
    store,
    deactivate() {
      // noop, no subscriptions in this plugin
    },
  };
}
