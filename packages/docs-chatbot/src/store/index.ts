import type { Store } from 'redux';
import type { PreferencesAccess } from 'compass-preferences-model/provider';
import type { ConnectionsService } from '@mongodb-js/compass-connections/provider';
import type { TrackFunction } from '@mongodb-js/compass-telemetry/provider';
import type { Logger } from '@mongodb-js/compass-logging/provider';
import type { MongoDBInstancesManager } from '@mongodb-js/compass-app-stores/provider';
import { applyMiddleware, createStore } from 'redux';
import type AppRegistry from 'hadron-app-registry';
import reducer from './reducer';
import type { DocsChatbotState, DocsChatbotThunkDispatch } from './reducer';
import thunk from 'redux-thunk';
import type { ActivateHelpers } from 'hadron-app-registry';
import { openSidebarChat } from './sidebar-chat';
// import { ChatbotStoreContext } from './context';
import { openContextualMessageInChat } from './chat';
// import { ChatbotStoreContext } from './context';
// import { openContextualMessageInChat } from './chat';

export type DocsChatbotStoreOptions = Record<string, unknown>;

export type DocsChatbotStoreServices = {
  preferences: PreferencesAccess;
  connections: ConnectionsService;
  instanceManager: MongoDBInstancesManager;
  globalAppRegistry: Pick<AppRegistry, 'on' | 'emit' | 'removeListener'>;
  track: TrackFunction;
  logger: Logger;
};

// Right now we're rocking a global singleton store for the chat.
// This is easier than doing some nicer things with context which we would
// want to do to productionize.
let storeSingleton: Store<DocsChatbotState> & {
  dispatch: DocsChatbotThunkDispatch;
};

export function configureStore(services: DocsChatbotStoreServices) {
  const cancelControllerRef = { current: null };

  if (!storeSingleton) {
    storeSingleton = createStore(
      reducer,
      applyMiddleware(
        thunk.withExtraArgument({ ...services, cancelControllerRef })
      )
    );
  }

  return storeSingleton;
}

export function activateDocsChatbotPlugin(
  _: DocsChatbotStoreOptions,
  services: DocsChatbotStoreServices,
  { on, cleanup }: ActivateHelpers
) {
  // This is hacky, pls don't look.
  const singletonAlreadyExists = !!storeSingleton;

  const store = configureStore(services);

  if (singletonAlreadyExists) {
    on(services.globalAppRegistry, 'open-sidebar-chat', () => {
      store.dispatch(openSidebarChat());
    });

    on(services.globalAppRegistry, 'open-message-in-chat', (options) => {
      // TODO: Here or in the action let's publish back to
      // the app registry with an id from the message when
      // actions happen that would action on the original caller.
      // Like when editing a pipeline.

      void store.dispatch(openContextualMessageInChat(options));
    });
  }

  return {
    store,
    deactivate: cleanup,
    // context: ChatbotStoreContext,
  };
}
