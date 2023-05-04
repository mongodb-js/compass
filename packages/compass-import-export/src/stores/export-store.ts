import type AppRegistry from 'hadron-app-registry';
import type { DataService } from 'mongodb-data-service';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import type { Store, AnyAction } from 'redux';

import { globalAppRegistryActivated } from '../modules/compass/global-app-registry';
import {
  dataServiceConnected,
  dataServiceDisconnected,
} from '../modules/compass/data-service';
import { rootExportReducer, openExport } from '../modules/export';

const _store = createStore(rootExportReducer, applyMiddleware(thunk));

type StoreActions<T> = T extends Store<unknown, infer A> ? A : never;

type StoreState<T> = T extends Store<infer S, AnyAction> ? S : never;

export type RootExportActions = StoreActions<typeof _store>;

export type RootExportState = StoreState<typeof _store>;

const store = Object.assign(_store, {
  onActivated(globalAppRegistry: AppRegistry) {
    store.dispatch(globalAppRegistryActivated(globalAppRegistry));

    globalAppRegistry.on(
      'data-service-connected',
      (err: Error | undefined, dataService: DataService) => {
        store.dispatch(dataServiceConnected(err, dataService));
      }
    );

    // Abort the export operation when it's in progress.
    globalAppRegistry.on('data-service-disconnected', () => {
      store.dispatch(dataServiceDisconnected());
    });

    globalAppRegistry.on(
      'open-export',
      ({ namespace, query, exportFullCollection, aggregation, origin }) => {
        store.dispatch(
          openExport({
            namespace,
            query: {
              // In the query bar we use `project` instead of `projection`.
              ...query,
              ...(query?.project ? { projection: query.project } : {}),
            },
            exportFullCollection,
            aggregation,
            origin,
          })
        );
      }
    );
  },
});

export { store };
