import type AppRegistry from 'hadron-app-registry';
import type { Action, AnyAction } from 'redux';
import { createStore, applyMiddleware, combineReducers } from 'redux';
import type { ThunkAction } from 'redux-thunk';
import thunk from 'redux-thunk';
import {
  closeExport,
  exportReducer,
  openExport,
  connectionDisconnected,
} from '../modules/export';
import type { PreferencesAccess } from 'compass-preferences-model';
import type { Logger } from '@mongodb-js/compass-logging/provider';
import type { ActivateHelpers } from 'hadron-app-registry';
import type { ConnectionsService } from '@mongodb-js/compass-connections/provider';
import type { TrackFunction } from '@mongodb-js/compass-telemetry';

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
  connections: ConnectionsService;
  preferences: PreferencesAccess;
  logger: Logger;
  track: TrackFunction;
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
    connections,
    preferences,
    logger,
    track,
  }: ExportPluginServices,
  { on, cleanup, addCleanup }: ActivateHelpers
) {
  const store = configureStore({
    globalAppRegistry,
    connections,
    preferences,
    logger,
    track,
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
  on(connections, 'disconnected', function (connectionId: string) {
    store.dispatch(connectionDisconnected(connectionId));
  });

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

export type ExportStore = ReturnType<typeof configureStore>;
