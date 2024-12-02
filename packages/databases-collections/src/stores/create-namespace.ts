import type AppRegistry from 'hadron-app-registry';
import type { ConnectionsService } from '@mongodb-js/compass-connections/provider';
import {} from '@mongodb-js/compass-connections/provider';
import type { MongoDBInstance } from 'mongodb-instance-model';
import type { Logger } from '@mongodb-js/compass-logging';
import type { Action, AnyAction } from 'redux';
import { applyMiddleware, createStore } from 'redux';
import type { ThunkAction } from 'redux-thunk';
import thunk from 'redux-thunk';
import reducer, {
  kmsProvidersRetrieved,
  serverVersionRetrieved,
  open,
  topologyChanged,
} from '../modules/create-namespace';
import type toNS from 'mongodb-ns';
import type { workspacesServiceLocator } from '@mongodb-js/compass-workspaces/provider';
import type { ActivateHelpers } from 'hadron-app-registry';
import {
  MongoDBInstancesManagerEvents,
  type MongoDBInstancesManager,
} from '@mongodb-js/compass-app-stores/provider';
import type { TrackFunction } from '@mongodb-js/compass-telemetry';

type NS = ReturnType<typeof toNS>;

export type CreateNamespaceServices = {
  connections: ConnectionsService;
  instancesManager: MongoDBInstancesManager;
  globalAppRegistry: AppRegistry;
  logger: Logger;
  track: TrackFunction;
  workspaces: ReturnType<typeof workspacesServiceLocator>;
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
  const { instancesManager, connections, globalAppRegistry } = services;
  const store = configureStore(services);
  const onInstanceProvided = (
    connectionId: string,
    instance: MongoDBInstance
  ) => {
    store.dispatch(
      serverVersionRetrieved(connectionId, instance.build.version)
    );
    store.dispatch(
      topologyChanged(connectionId, instance.topologyDescription.type)
    );

    // Because the version could be undefined if the instance hasn't finished
    // refreshing
    on(instance, 'change:build.version', () => {
      store.dispatch(
        serverVersionRetrieved(connectionId, instance.build.version)
      );
    });

    on(instance, 'change:topologyDescription', () => {
      store.dispatch(
        topologyChanged(connectionId, instance.topologyDescription.type)
      );
    });
  };

  const onDataServiceProvided = (connectionId: string) => {
    const dataService = connections.getDataServiceForConnection(connectionId);
    store.dispatch(
      kmsProvidersRetrieved(connectionId, dataService.configuredKMSProviders())
    );
  };

  for (const [
    connectionId,
    instance,
  ] of instancesManager.listMongoDBInstances()) {
    onInstanceProvided(connectionId, instance);
    onDataServiceProvided(connectionId);
  }

  on(
    instancesManager,
    MongoDBInstancesManagerEvents.InstanceCreated,
    onInstanceProvided
  );

  on(connections, 'connected', onDataServiceProvided);

  on(
    globalAppRegistry,
    'open-create-database',
    ({
      connectionId,
    }: {
      connectionId?: string;
    } = {}) => {
      if (!connectionId) {
        throw new Error(
          'Cannot create a database without specifying a connection id'
        );
      }
      store.dispatch(open(connectionId, null));
    }
  );

  on(
    globalAppRegistry,
    'open-create-collection',
    (
      ns: NS,
      {
        connectionId,
      }: {
        connectionId?: string;
      } = {}
    ) => {
      if (!connectionId) {
        throw new Error(
          'Cannot create a collection without specifying a connection id'
        );
      }
      store.dispatch(open(connectionId, ns.database));
    }
  );

  return {
    store,
    deactivate: cleanup,
  };
}
