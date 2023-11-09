import type AppRegistry from 'hadron-app-registry';
import type { DataService } from 'mongodb-data-service';
import type { Action, AnyAction } from 'redux';
import { createStore, applyMiddleware, combineReducers } from 'redux';
import type { ThunkAction } from 'redux-thunk';
import thunk from 'redux-thunk';
import {
  globalAppRegistryActivated,
  globalAppRegistry,
  dataService,
} from '../modules/compass';
import {
  dataServiceConnected,
  dataServiceDisconnected,
} from '../modules/compass/data-service';
import { exportReducer, openExport } from '../modules/export';

export function configureStore() {
  return createStore(
    combineReducers({
      export: exportReducer,
      globalAppRegistry,
      dataService,
    }),
    applyMiddleware(thunk)
  );
}

export type RootExportState = ReturnType<
  ReturnType<typeof configureStore>['getState']
>;

export type ExportThunkAction<R, A extends Action = AnyAction> = ThunkAction<
  R,
  RootExportState,
  void,
  A
>;

export function activatePlugin(
  _: unknown,
  { globalAppRegistry }: { globalAppRegistry: AppRegistry }
) {
  const store = configureStore();

  store.dispatch(globalAppRegistryActivated(globalAppRegistry));

  const onDataServiceConnected = (
    err: Error | undefined,
    dataService: DataService
  ) => {
    store.dispatch(dataServiceConnected(err, dataService));
  };

  globalAppRegistry.on('data-service-connected', onDataServiceConnected);

  const onDataServiceDisconnected = () => {
    store.dispatch(dataServiceDisconnected());
  };

  // Abort the export operation when it's in progress.
  globalAppRegistry.on('data-service-disconnected', onDataServiceDisconnected);

  const onOpenExport = ({
    namespace,
    query,
    exportFullCollection,
    aggregation,
    origin,
  }: {
    namespace: string;
    query: any;
    exportFullCollection: true;
    aggregation: any;
    origin: 'menu' | 'crud-toolbar' | 'empty-state' | 'aggregations-toolbar';
  }) => {
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
  };

  globalAppRegistry.on('open-export', onOpenExport);

  return {
    store,
    deactivate() {
      globalAppRegistry.removeListener(
        'data-service-connected',
        onDataServiceConnected
      );
      globalAppRegistry.removeListener(
        'data-service-disconnected',
        onDataServiceDisconnected
      );
      globalAppRegistry.removeListener('open-export', onOpenExport);
    },
  };
}
