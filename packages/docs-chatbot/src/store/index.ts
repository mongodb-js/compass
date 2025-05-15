import type { PreferencesAccess } from 'compass-preferences-model/provider';
import type { ConnectionsService } from '@mongodb-js/compass-connections/provider';
import type { TrackFunction } from '@mongodb-js/compass-telemetry/provider';
import type { Logger } from '@mongodb-js/compass-logging/provider';
import type { MongoDBInstancesManager } from '@mongodb-js/compass-app-stores/provider';
import { applyMiddleware, createStore } from 'redux';
import type AppRegistry from 'hadron-app-registry';
import reducer from './reducer';
import thunk from 'redux-thunk';
import type { ActivateHelpers } from 'hadron-app-registry';
import { openSidebarChat } from './sidebar-chat';

export type DocsChatbotStoreOptions = Record<string, unknown>;

export type DocsChatbotStoreServices = {
  preferences: PreferencesAccess;
  connections: ConnectionsService;
  instanceManager: MongoDBInstancesManager;
  globalAppRegistry: Pick<AppRegistry, 'on' | 'emit' | 'removeListener'>;
  track: TrackFunction;
  logger: Logger;
};

export function activateDocsChatbotStore(
  _: DocsChatbotStoreOptions,
  services: DocsChatbotStoreServices,
  { on, cleanup }: ActivateHelpers
) {
  const cancelControllerRef = { current: null };
  const store = createStore(
    reducer,
    applyMiddleware(
      thunk.withExtraArgument({ ...services, cancelControllerRef })
    )
  );

  on(services.globalAppRegistry, 'open-sidebar-chat', () => {
    store.dispatch(openSidebarChat());
  });

  return { store, deactivate: cleanup };
}
