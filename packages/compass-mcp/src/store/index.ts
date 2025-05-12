import type { PreferencesAccess } from 'compass-preferences-model/provider';
import type { ConnectionsService } from '@mongodb-js/compass-connections/provider';
import type { TrackFunction } from '@mongodb-js/compass-telemetry/provider';
import type { Logger } from '@mongodb-js/compass-logging/provider';
import type { MongoDBInstancesManager } from '@mongodb-js/compass-app-stores/provider';
import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';
import type { ActivateHelpers } from 'hadron-app-registry';

export type MCPStoreOptions = Record<string, unknown>;

export type MCPStoreServices = {
  preferences: PreferencesAccess;
  connections: ConnectionsService;
  instanceManager: MongoDBInstancesManager;
  track: TrackFunction;
  logger: Logger;
};

function reducer() {
  return {};
}

export function activateMCPStore(
  _: MCPStoreOptions,
  services: MCPStoreServices,
  { cleanup }: ActivateHelpers
) {
  const cancelControllerRef = { current: null };
  const store = createStore(
    reducer,
    applyMiddleware(
      thunk.withExtraArgument({ ...services, cancelControllerRef })
    )
  );
  return { store, deactivate: cleanup };
}
