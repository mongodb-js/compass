import type AppRegistry from 'hadron-app-registry';
import type { DataService } from 'mongodb-data-service';
import type { Action, AnyAction } from 'redux';
import { createStore, applyMiddleware, combineReducers } from 'redux';
import type { ThunkAction } from 'redux-thunk';
import thunk from 'redux-thunk';
import { closeExport, exportReducer, openExport } from '../modules/export';

export function configureStore(services: ExportPluginServices) {
  return createStore(
    combineReducers({
      export: exportReducer,
    }),
    applyMiddleware(thunk.withExtraArgument(services))
  );
}

export type RootExportState = ReturnType<
  ReturnType<typeof configureStore>['getState']
>;

export type ExportPluginServices = {
  globalAppRegistry: AppRegistry;
  dataService: Pick<DataService, 'findCursor' | 'aggregateCursor'>;
};

export type ExportThunkAction<R, A extends Action = AnyAction> = ThunkAction<
  R,
  RootExportState,
  ExportPluginServices,
  A
>;

export function activatePlugin(
  _: unknown,
  { globalAppRegistry, dataService }: ExportPluginServices
) {
  const store = configureStore({ globalAppRegistry, dataService });

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
      globalAppRegistry.removeListener('open-export', onOpenExport);
      // We use close and not cancel because cancel doesn't actually cancel
      // everything
      store.dispatch(closeExport());
    },
  };
}
