import type AppRegistry from 'hadron-app-registry';
import type { Action, AnyAction } from 'redux';
import { createStore, applyMiddleware, combineReducers } from 'redux';
import type { ThunkAction } from 'redux-thunk';
import thunk from 'redux-thunk';
import { cancelImport, importReducer, openImport } from '../modules/import';
import type { WorkspacesService } from '@mongodb-js/compass-workspaces/provider';
import type { Logger } from '@mongodb-js/compass-logging/provider';
import type {
  ConnectionRepository,
  ConnectionsManager,
} from '@mongodb-js/compass-connections/provider';
import type { ActivateHelpers } from 'hadron-app-registry';
import type { TrackFunction } from '@mongodb-js/compass-telemetry';

export type ImportPluginServices = {
  globalAppRegistry: AppRegistry;
  workspaces: WorkspacesService;
  logger: Logger;
  track: TrackFunction;
  connectionsManager: ConnectionsManager;
  connectionRepository: ConnectionRepository;
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

type OpenImportEvent = {
  namespace: string;
  origin: 'menu' | 'crud-toolbar' | 'empty-state';
};

type ConnectionMeta = {
  connectionId?: string;
};

export function activatePlugin(
  _: unknown,
  {
    globalAppRegistry,
    connectionsManager,
    connectionRepository,
    workspaces,
    logger,
    track,
  }: ImportPluginServices,
  { on, cleanup, addCleanup }: ActivateHelpers
) {
  const store = configureStore({
    globalAppRegistry,
    workspaces,
    logger,
    track,
    connectionsManager,
    connectionRepository,
  });

  addCleanup(() => {
    store.dispatch(cancelImport());
  });

  on(
    globalAppRegistry,
    'open-import',
    function onOpenImport(
      { namespace, origin }: OpenImportEvent,
      { connectionId }: ConnectionMeta = {}
    ) {
      if (!connectionId) {
        throw new Error('Cannot open Import modal without a connectionId');
      }

      store.dispatch(openImport({ namespace, origin, connectionId }));
    }
  );

  return {
    store,
    deactivate: cleanup,
  };
}
