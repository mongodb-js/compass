import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import reducer from '../modules';
import { closeInstance, setupInstance } from '../modules/instance';
import type {
  ActivateHelpers,
  AppRegistry,
} from '@mongodb-js/compass-app-registry';
import type { Logger } from '@mongodb-js/compass-logging/provider';
import {
  type MongoDBInstancesManager,
  MongoDBInstancesManagerEvents,
} from '@mongodb-js/compass-app-stores/provider';
import type { ConnectionsService } from '@mongodb-js/compass-connections/provider';
import type { MCPController } from '@mongodb-js/compass-generative-ai';

export function createSidebarStore(
  {
    globalAppRegistry,
    connections,
    instancesManager,
    logger,
    mcpController,
  }: {
    globalAppRegistry: AppRegistry;
    connections: ConnectionsService;
    instancesManager: MongoDBInstancesManager;
    logger: Logger;
    mcpController: MCPController;
  },
  { on, cleanup }: ActivateHelpers
) {
  const store = createStore(
    reducer,
    applyMiddleware(
      thunk.withExtraArgument({
        globalAppRegistry,
        connections,
        instancesManager,
        logger,
        mcpController,
      })
    )
  );

  const instances = instancesManager.listMongoDBInstances();

  for (const [connectionId, instance] of instances) {
    store.dispatch(setupInstance(connectionId, instance));
  }

  on(
    instancesManager,
    MongoDBInstancesManagerEvents.InstanceCreated,
    (connectionId, instance) =>
      store.dispatch(setupInstance(connectionId, instance))
  );

  on(
    instancesManager,
    MongoDBInstancesManagerEvents.InstanceRemoved,
    (connectionId) => store.dispatch(closeInstance(connectionId))
  );

  return {
    store,
    deactivate: cleanup,
  };
}
