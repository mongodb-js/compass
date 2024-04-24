import type AppRegistry from 'hadron-app-registry';
import type {
  ConnectionInfoAccess,
  DataService,
} from '@mongodb-js/compass-connections/provider';
import type { MongoDBInstance } from 'mongodb-instance-model';
import type { LoggerAndTelemetry } from '@mongodb-js/compass-logging';
import type { Action, AnyAction } from 'redux';
import { applyMiddleware, createStore } from 'redux';
import type { ThunkAction } from 'redux-thunk';
import thunk from 'redux-thunk';
import reducer, {
  INITIAL_STATE,
  open,
  topologyChanged,
} from '../modules/create-namespace';
import type toNS from 'mongodb-ns';
import type { workspacesServiceLocator } from '@mongodb-js/compass-workspaces/provider';
import type { ActivateHelpers } from 'hadron-app-registry';

type NS = ReturnType<typeof toNS>;

export type CreateNamespaceServices = {
  dataService: Pick<
    DataService,
    'createCollection' | 'createDataKey' | 'configuredKMSProviders'
  >;
  globalAppRegistry: AppRegistry;
  instance: MongoDBInstance;
  logger: LoggerAndTelemetry;
  workspaces: ReturnType<typeof workspacesServiceLocator>;
  connectionInfoAccess: ConnectionInfoAccess;
};

function configureStore(services: CreateNamespaceServices) {
  return createStore(
    reducer,
    {
      ...INITIAL_STATE,
      serverVersion: services.instance.build.version,
      currentTopologyType: services.instance.topologyDescription.type,
      configuredKMSProviders: services.dataService.configuredKMSProviders(),
    },
    applyMiddleware(thunk.withExtraArgument(services))
  );
}

export type CreateNamespaceRootState = ReturnType<
  ReturnType<typeof configureStore>['getState']
>;

export type CreateNamespaceThunkAction<
  R,
  A extends Action = AnyAction
> = ThunkAction<R, CreateNamespaceRootState, CreateNamespaceServices, A>;

export function activatePlugin(
  _: unknown,
  services: CreateNamespaceServices,
  { on, cleanup }: ActivateHelpers
) {
  const store = configureStore(services);

  const { instance, globalAppRegistry } = services;

  on(instance, 'change:topologyDescription', () => {
    store.dispatch(topologyChanged(instance.topologyDescription.type));
  });

  on(globalAppRegistry, 'open-create-database', () => {
    store.dispatch(open(null));
  });

  on(globalAppRegistry, 'open-create-collection', (ns: NS) => {
    store.dispatch(open(ns.database));
  });

  return {
    store,
    deactivate: cleanup,
  };
}
