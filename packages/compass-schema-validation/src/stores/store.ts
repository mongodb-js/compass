import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import type { RootState } from '../modules';
import reducer, { INITIAL_STATE } from '../modules';
import toNS from 'mongodb-ns';
import { namespaceChanged } from '../modules/namespace';
import { fieldsChanged } from '../modules/fields';
import { activateValidation } from '../modules/validation';
import { editModeChanged } from '../modules/edit-mode';
import semver from 'semver';
import type { CollectionTabPluginMetadata } from '@mongodb-js/compass-collection';
import type { ActivateHelpers, AppRegistry } from 'hadron-app-registry';
import type { DataService } from 'mongodb-data-service';
import type { MongoDBInstance } from '@mongodb-js/compass-app-stores/provider';
import type { PreferencesAccess } from 'compass-preferences-model';
import type { LoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';

/**
 * The lowest supported version.
 */
const MIN_VERSION = '3.2.0';

type SchemaValidationServices = {
  localAppRegistry: AppRegistry;
  dataService: Pick<
    DataService,
    'aggregate' | 'collectionInfo' | 'updateCollection'
  >;
  preferences: PreferencesAccess;
  instance: MongoDBInstance;
  logger: LoggerAndTelemetry;
};

// Exposed for testing
export function configureStore(
  state: Partial<RootState>,
  services: Pick<
    SchemaValidationServices,
    'localAppRegistry' | 'dataService' | 'preferences' | 'logger'
  >
) {
  return createStore(
    reducer,
    {
      ...INITIAL_STATE,
      ...state,
    },
    applyMiddleware(thunk.withExtraArgument(services))
  );
}

/**
 * The store has a combined pipeline reducer plus the thunk middleware.
 */
export function onActivated(
  options: CollectionTabPluginMetadata,
  {
    localAppRegistry,
    dataService,
    preferences,
    instance,
    logger,
  }: SchemaValidationServices,
  { on, cleanup }: ActivateHelpers
) {
  const store = configureStore(
    {
      serverVersion: instance.build.version,
      editMode: {
        collectionTimeSeries: !!options.isTimeSeries,
        collectionReadOnly: options.isReadonly ? true : false,
        writeStateStoreReadOnly: !instance.isWritable,
        oldServerReadOnly: semver.gte(MIN_VERSION, instance.build.version),
      },
    },
    {
      dataService,
      preferences,
      localAppRegistry,
      logger,
    }
  );

  /**
   * When the collection is changed, update the store.
   */
  on(globalAppRegistry, 'fields-changed', (fields) => {
    if (fields.ns === options.namespace) {
      store.dispatch(fieldsChanged(fields.fields));
    }
  });

  // isWritable can change later
  instance.on('change:isWritable', () => {
    store.dispatch(
      editModeChanged({
        writeStateStoreReadOnly: !instance.isWritable,
      })
    );
  });

  if (options.namespace) {
    const namespace = toNS(options.namespace);
    store.dispatch(namespaceChanged(namespace));
  }

  // Activate validation when this plugin is first rendered
  store.dispatch(activateValidation());

  return {
    store,
    deactivate: cleanup,
  };
}
