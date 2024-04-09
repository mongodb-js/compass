import { createStore, applyMiddleware } from 'redux';
import throttle from 'lodash/throttle';
import thunk from 'redux-thunk';
import reducer from '../modules';
import {
  SETUP_INSTANCE,
  changeInstance,
  setupInstance,
} from '../modules/instance';
import type { Database } from '../modules/databases';
import { changeDatabases } from '../modules/databases';
import { toggleIsGenuineMongoDBVisible } from '../modules/is-genuine-mongodb-visible';
import { changeConnectionInfo } from '../modules/connection-info';
import { changeConnectionOptions } from '../modules/connection-options';
import { setDataService } from '../modules/data-service';
import type { ActivateHelpers, AppRegistry } from 'hadron-app-registry';
import type { MongoDBInstance } from 'mongodb-instance-model';
import type {
  ConnectionsManager,
  DataService,
} from '@mongodb-js/compass-connections/provider';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import { setIsPerformanceTabSupported } from '../modules/is-performance-tab-supported';
import type { MongoServerError } from 'mongodb';
import type { LoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';
import { MongoDBInstancesManager } from '@mongodb-js/compass-app-stores/provider';
import { ConnectionInfoAccess } from '@mongodb-js/connection-storage/provider';

export function createSidebarStore(
  {
    globalAppRegistry,
    connectionsManager,
    instancesManager,
    logger: { log, mongoLogId },
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
        logger: { log, mongoLogId },
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
