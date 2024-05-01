import type AppRegistry from 'hadron-app-registry';
import type { Action, AnyAction } from 'redux';
import { createStore, applyMiddleware, combineReducers } from 'redux';
import type { ThunkAction } from 'redux-thunk';
import thunk from 'redux-thunk';
import type { DataService } from 'mongodb-data-service';
import { cancelImport, importReducer, openImport } from '../modules/import';
import type { WorkspacesService } from '@mongodb-js/compass-workspaces/provider';
import type { LoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';
import type { ConnectionInfoAccess } from '@mongodb-js/compass-connections/provider';

export type ImportPluginServices = {
  globalAppRegistry: AppRegistry;
  dataService: Pick<DataService, 'isConnected' | 'bulkWrite' | 'insertOne'>;
  workspaces: WorkspacesService;
  logger: LoggerAndTelemetry;
  connectionInfoAccess: ConnectionInfoAccess;
};

export function configureStore(services: ImportPluginServices) {
  return createStore(
    combineReducers({
      import: importReducer,
    }),
    applyMiddleware(thunk.withExtraArgument(services))
  );
}

export type RootImportState = ReturnType<
  ReturnType<typeof configureStore>['getState']
>;

export type ImportThunkAction<R, A extends Action = AnyAction> = ThunkAction<
  R,
  RootImportState,
  ImportPluginServices,
  A
>;

export function activatePlugin(
  _: unknown,
  {
    globalAppRegistry,
    dataService,
    workspaces,
    logger,
    connectionInfoAccess,
  }: ImportPluginServices
) {
  const store = configureStore({
    globalAppRegistry,
    dataService,
    workspaces,
    logger,
    connectionInfoAccess,
  });

  const onOpenImport = ({
    namespace,
    origin,
  }: {
    namespace: string;
    origin: 'menu' | 'crud-toolbar' | 'empty-state';
  }) => {
    store.dispatch(openImport({ namespace, origin }));
  };

  globalAppRegistry.on('open-import', onOpenImport);

  return {
    store,
    deactivate() {
      store.dispatch(cancelImport());
      globalAppRegistry.removeListener('open-import', onOpenImport);
    },
  };
}
