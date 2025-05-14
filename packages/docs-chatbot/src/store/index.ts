import type { PreferencesAccess } from 'compass-preferences-model/provider';
import type { ConnectionsService } from '@mongodb-js/compass-connections/provider';
import type { TrackFunction } from '@mongodb-js/compass-telemetry/provider';
import type { Logger } from '@mongodb-js/compass-logging/provider';
import type { MongoDBInstancesManager } from '@mongodb-js/compass-app-stores/provider';
import { applyMiddleware, createStore } from 'redux';
import reducer from './reducer';
import thunk from 'redux-thunk';
import type { ActivateHelpers } from 'hadron-app-registry';

export type DocsChatbotStoreOptions = Record<string, unknown>;

export type DocsChatbotStoreServices = {
  preferences: PreferencesAccess;
  connections: ConnectionsService;
  instanceManager: MongoDBInstancesManager;
  track: TrackFunction;
  logger: Logger;
};

export function activateDocsChatbotStore(
  _: DocsChatbotStoreOptions,
  services: DocsChatbotStoreServices,
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
