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
  dataServiceProvided,
  instanceProvided,
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
  const { instance, globalAppRegistry, dataService } = services;
  const store = configureStore(services);
  const onInstanceProvided = (instance: MongoDBInstance) => {
    store.dispatch(
      instanceProvided({
        serverVersion: instance.build.version,
        topology: instance.topologyDescription.type,
      })
    );

    on(instance, 'change:topologyDescription', () => {
      store.dispatch(topologyChanged(instance.topologyDescription.type));
    });
  };

  const onDataServiceProvided = (
    dataService: Pick<
      DataService,
      'createCollection' | 'createDataKey' | 'configuredKMSProviders'
    >
  ) => {
    store.dispatch(
      dataServiceProvided({
        configuredKMSProviders: dataService.configuredKMSProviders(),
      })
    );
  };

  onInstanceProvided(instance);
  onDataServiceProvided(dataService);

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
