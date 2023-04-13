import type AppRegistry from 'hadron-app-registry';
import { configureStore } from '@reduxjs/toolkit';
import type { DataService } from 'mongodb-data-service';

import { globalAppRegistry, dataService } from '../modules/compass';
import { globalAppRegistryActivated } from '../modules/compass/global-app-registry';
import {
  dataServiceConnected,
  dataServiceDisconnected,
} from '../modules/compass/data-service';
import { exportReducer, openExport } from '../modules/export';

export const store = Object.assign(
  configureStore({
    reducer: {
      globalAppRegistry,
      dataService,
      export: exportReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        // Currently we are storing the app registry and data service in the store.
        // These are not serializable so we disable these default middleware checks.
        immutableCheck: false,
        serializableCheck: false,
      }),
  }),
  {
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
        ({ namespace, query, exportFullCollection, aggregation }) => {
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
            })
          );
        }
      );
    },
  }
);

export type RootExportState = ReturnType<typeof store.getState>;
export type ExportAppDispatch = typeof store.dispatch;
