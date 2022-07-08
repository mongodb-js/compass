import type AppRegistry from 'hadron-app-registry';
import { createStore, applyMiddleware, combineReducers } from 'redux';
import type { Store, AnyAction } from 'redux';
import thunk from 'redux-thunk';
import instanceReducer, { setInstance, resetInstance } from './instance';
import dataServiceReducer, {
  setDataService,
  resetDataService,
} from './data-service';
import openItemReducer from './open-item';
import editItemReducer from './edit-item';
import deleteItemReducer from './delete-item';
import appRegistryReducer, { setAppRegistry } from './app-registry';

const _store = createStore(
  combineReducers({
    instance: instanceReducer,
    dataService: dataServiceReducer,
    openItem: openItemReducer,
    editItem: editItemReducer,
    deleteItem: deleteItemReducer,
    appRegistry: appRegistryReducer,
  }),
  applyMiddleware(thunk)
);

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
