import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import reducer from '../modules';
import { setupInstance } from '../modules/instance';
import type { ActivateHelpers, AppRegistry } from 'hadron-app-registry';
import type { ConnectionsManager } from '@mongodb-js/compass-connections/provider';
import type { LoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';
import type { MongoDBInstancesManager } from '@mongodb-js/compass-app-stores/provider';

export function createSidebarStore(
  {
    globalAppRegistry,
    connectionsManager,
    instancesManager,
    logger,
  }: {
    globalAppRegistry: AppRegistry;
    connectionsManager: ConnectionsManager;
    instancesManager: MongoDBInstancesManager;
    logger: LoggerAndTelemetry;
  },
  { cleanup }: ActivateHelpers
) {
  const store = createStore(
    reducer,
    applyMiddleware(
      thunk.withExtraArgument({
        globalAppRegistry,
        connectionsManager,
        instancesManager,
        logger,
      })
    )
  );

  const instances = instancesManager.listMongoDBInstances();
  for (const [connectionId, instance] of instances) {
    store.dispatch(setupInstance(connectionId, instance));
  }

  return {
    store,
    deactivate: cleanup,
  };
}
