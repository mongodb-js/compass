import type AppRegistry from 'hadron-app-registry';
import type { DataService } from 'mongodb-data-service';
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

type NS = ReturnType<typeof toNS>;

export type CreateNamespaceServices = {
  dataService: Pick<
    DataService,
    'createCollection' | 'createDataKey' | 'configuredKMSProviders'
  >;
  globalAppRegistry: AppRegistry;
  instance: MongoDBInstance;
  logger: LoggerAndTelemetry;
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

export function activatePlugin(_: unknown, services: CreateNamespaceServices) {
  const store = configureStore(services);

  const { instance, globalAppRegistry } = services;

  const onTopologyChange = () => {
    topologyChanged(instance.topologyDescription.type);
  };

  instance.on('change:topologyDescription', onTopologyChange);

  const onOpenCreateDatabase = () => {
    store.dispatch(open(null));
  };

  globalAppRegistry.on('open-create-database', onOpenCreateDatabase);

  const onOpenCreateCollection = (ns: NS) => {
    store.dispatch(open(ns.database));
  };

  globalAppRegistry.on('open-create-collection', onOpenCreateCollection);

  return {
    store,
    deactivate() {
      instance.removeListener('change:topologyDescription', onTopologyChange);
      globalAppRegistry.removeListener(
        'open-create-database',
        onOpenCreateDatabase
      );
      globalAppRegistry.removeListener(
        'open-create-collection',
        onOpenCreateCollection
      );
    },
  };
}
