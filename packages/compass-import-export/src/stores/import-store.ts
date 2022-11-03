import type AppRegistry from 'hadron-app-registry';
import { createStore, applyMiddleware } from 'redux';
import type { Store, AnyAction } from 'redux';
import thunk from 'redux-thunk';

import reducer from '../modules';
import {
  dataServiceConnected,
  globalAppRegistryActivated,
} from '../modules/compass';
import { openImport } from '../modules/import';

const _store = createStore(reducer, applyMiddleware(thunk));

type StoreActions<T> = T extends Store<unknown, infer A> ? A : never;

type StoreState<T> = T extends Store<infer S, AnyAction> ? S : never;

export type RootImportActions = StoreActions<typeof _store>;

export type RootImportState = StoreState<typeof _store>;

const store = Object.assign(_store, {
  onActivated(globalAppRegistry: AppRegistry) {
    store.dispatch(globalAppRegistryActivated(globalAppRegistry));

    globalAppRegistry.on('data-service-connected', (err, dataService) => {
      store.dispatch(dataServiceConnected(err, dataService));
    });

    globalAppRegistry.on('open-import', ({ namespace }) => {
      store.dispatch(openImport(namespace));
    });
  },
});

export default store;
