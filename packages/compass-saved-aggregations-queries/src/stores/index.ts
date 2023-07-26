import type AppRegistry from 'hadron-app-registry';
import { createStore, applyMiddleware, combineReducers } from 'redux';
import type { Store, AnyAction, Action } from 'redux';
import thunk from 'redux-thunk';
import type { ThunkAction } from 'redux-thunk';
import itemsReducer from './aggregations-queries-items';
import instanceReducer, { setInstance, resetInstance } from './instance';
import dataServiceReducer, {
  setDataService,
  resetDataService,
} from './data-service';
import openItemReducer from './open-item';
import editItemReducer from './edit-item';
import appRegistryReducer, { setAppRegistry } from './app-registry';

import { FavoriteQueryStorage } from '@mongodb-js/compass-query-bar';
import { PipelineStorage } from '@mongodb-js/compass-aggregations';
import { getStoragePaths } from '@mongodb-js/compass-utils';

const { basepath } = getStoragePaths() ?? {};
const queryStorage = new FavoriteQueryStorage(basepath);
const pipelineStorage = new PipelineStorage(basepath);

const _store = createStore(
  combineReducers({
    savedItems: itemsReducer,
    instance: instanceReducer,
    dataService: dataServiceReducer,
    openItem: openItemReducer,
    editItem: editItemReducer,
    appRegistry: appRegistryReducer,
  }),
  applyMiddleware(
    thunk.withExtraArgument({
      pipelineStorage,
      queryStorage,
    })
  )
);

export type SavedQueryAggregationExtraArgs = {
  pipelineStorage: PipelineStorage;
  queryStorage: FavoriteQueryStorage;
};

export type SavedQueryAggregationThunkAction<
  R,
  A extends Action = AnyAction
> = ThunkAction<R, RootState, SavedQueryAggregationExtraArgs, A>;

type StoreActions<T> = T extends Store<unknown, infer A> ? A : never;

type StoreState<T> = T extends Store<infer S, AnyAction> ? S : never;

export type RootActions = StoreActions<typeof _store>;

export type RootState = StoreState<typeof _store>;

const store = Object.assign(_store, {
  onActivated(appRegistry: AppRegistry) {
    store.dispatch(setAppRegistry(appRegistry));

    appRegistry.on('data-service-connected', (err, dataService) => {
      if (err) {
        return;
      }

      store.dispatch(setDataService(dataService));
    });

    appRegistry.on('data-service-disconnected', () => {
      store.dispatch(resetDataService());
    });

    appRegistry.on('instance-created', ({ instance }) => {
      store.dispatch(setInstance(instance));
    });

    appRegistry.on('instance-destroyed', () => {
      store.dispatch(resetInstance());
    });
  },
});

export default store;
