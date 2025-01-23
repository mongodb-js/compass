import type { Logger } from '@mongodb-js/compass-logging';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import type { CollectionTabPluginMetadata } from '@mongodb-js/compass-collection';
import type {
  ConnectionInfoRef,
  DataService as OriginalDataService,
} from '@mongodb-js/compass-connections/provider';
import type { ActivateHelpers } from 'hadron-app-registry';
import type AppRegistry from 'hadron-app-registry';
import type { PreferencesAccess } from 'compass-preferences-model/provider';
import type { FieldStoreService } from '@mongodb-js/compass-field-store';
import type { QueryBarService } from '@mongodb-js/compass-query-bar';
import type { TrackFunction } from '@mongodb-js/compass-telemetry';
import { reducer } from './reducer';

export type DataService = Pick<OriginalDataService, 'sample' | 'isCancelError'>;
export type SchemaPluginServices = {
  dataService: DataService;
  connectionInfoRef: ConnectionInfoRef;
  localAppRegistry: Pick<AppRegistry, 'on' | 'emit' | 'removeListener'>;
  globalAppRegistry: Pick<AppRegistry, 'on' | 'emit' | 'removeListener'>;
  logger: Logger;
  track: TrackFunction;
  preferences: PreferencesAccess;
  fieldStoreService: FieldStoreService;
  queryBar: QueryBarService;
};
/**
 * Configure a store with the provided options.
 *
 * @param {Object} options - The options.
 *
 * @returns {Store} The redux store.
 */
export function activateSchemaPlugin(
  options: Pick<CollectionTabPluginMetadata, 'namespace'>,
  services: SchemaPluginServices,
  { on, cleanup }: ActivateHelpers
) {
  const store = configureStore(services);
  /**
   * When `Share Schema as JSON` clicked in menu show a dialog message.
   */

  on(
    services.localAppRegistry,
    'menu-share-schema-json',
    () => store.dispatch(handleSchemaShare()) // TODO: get the action
  );

  return {
    store,
    deactivate() {
      cleanup();
    },
  };
}

export function configureStore(services: SchemaPluginServices) {
  const store = createStore(
    reducer,
    applyMiddleware(thunk.withExtraArgument(services))
  );
  return store;
}

export type AtlasServiceStore = ReturnType<typeof configureStore>;
