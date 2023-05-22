import type AppRegistry from 'hadron-app-registry';
import { createStore, applyMiddleware } from 'redux';
import type { Store, AnyAction } from 'redux';
import thunk from 'redux-thunk';
import type { DataService } from 'mongodb-data-service';

import { globalAppRegistryActivated } from '../modules/compass';
import {
  dataServiceConnected,
  dataServiceDisconnected,
} from '../modules/compass/data-service';
import { rootImportReducer, openImport } from '../modules/import';

const _store = createStore(rootImportReducer, applyMiddleware(thunk));

type StoreActions<T> = T extends Store<unknown, infer A> ? A : never;

type StoreState<T> = T extends Store<infer S, AnyAction> ? S : never;

export type RootImportActions = StoreActions<typeof _store>;

export type RootImportState = StoreState<typeof _store>;

const store = Object.assign(_store, {
  onActivated(globalAppRegistry: AppRegistry) {
    store.dispatch(globalAppRegistryActivated(globalAppRegistry));

    globalAppRegistry.on(
      'data-service-connected',
      (err: Error | undefined, dataService: DataService) => {
        store.dispatch(dataServiceConnected(err, dataService));
      }
    );

    // Abort the import operation when it's in progress.
    globalAppRegistry.on('data-service-disconnected', () => {
      store.dispatch(dataServiceDisconnected());
    });

    globalAppRegistry.on('open-import', ({ namespace, origin }) => {
      store.dispatch(
        openImport({
          namespace,
          origin,
        }) as unknown as AnyAction
      );
    });
  },
});

export { store };
