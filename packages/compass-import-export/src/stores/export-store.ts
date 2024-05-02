import type AppRegistry from 'hadron-app-registry';
import type { Action, AnyAction } from 'redux';
import { createStore, applyMiddleware, combineReducers } from 'redux';
import type { ThunkAction } from 'redux-thunk';
import thunk from 'redux-thunk';
import { closeExport, exportReducer, openExport } from '../modules/export';
import type { PreferencesAccess } from 'compass-preferences-model';
import type { LoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';
import type { ActivateHelpers } from 'hadron-app-registry';
import type { ConnectionsManager } from '@mongodb-js/compass-connections/provider';

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
  connectionsManager: ConnectionsManager;
  preferences: PreferencesAccess;
  logger: LoggerAndTelemetry;
};

export type ExportThunkAction<R, A extends Action = AnyAction> = ThunkAction<
  R,
  RootExportState,
  ExportPluginServices,
  A
>;

type OpenExportEvent = {
  namespace: string;
  query: any;
  exportFullCollection: true;
  aggregation: any;
  origin: 'menu' | 'crud-toolbar' | 'empty-state' | 'aggregations-toolbar';
};

type ConnectionMeta = {
  connectionId?: string;
};

export function activatePlugin(
  _: unknown,
  {
    globalAppRegistry,
    connectionsManager,
    preferences,
    logger,
  }: ExportPluginServices,
  { on, cleanup, addCleanup }: ActivateHelpers
) {
  const store = configureStore({
    globalAppRegistry,
    connectionsManager,
    preferences,
    logger,
  });

  on(
    globalAppRegistry,
    'open-export',
    function onOpenExport(
      {
        namespace,
        query,
        exportFullCollection,
        aggregation,
        origin,
      }: OpenExportEvent,
      { connectionId }: ConnectionMeta = {}
    ) {
      if (!connectionId) {
        throw new Error(
          'Cannot open Export modal without specifying connectionId'
        );
      }

      store.dispatch(
        openExport({
          connectionId,
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

  addCleanup(() => {
    // We use close and not cancel because cancel doesn't actually cancel
    // everything
    store.dispatch(closeExport());
  });

  return {
    store,
    deactivate: cleanup,
  };
}
