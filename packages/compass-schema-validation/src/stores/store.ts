import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import type { DataService, RootState } from '../modules';
import reducer, { INITIAL_STATE } from '../modules';
import toNS from 'mongodb-ns';
import { activateValidation } from '../modules/validation';
import { editModeChanged } from '../modules/edit-mode';
import semver from 'semver';
import type { CollectionTabPluginMetadata } from '@mongodb-js/compass-collection';
import type { ActivateHelpers, AppRegistry } from 'hadron-app-registry';
import type { ConnectionInfoRef } from '@mongodb-js/compass-connections/provider';
import type { MongoDBInstance } from '@mongodb-js/compass-app-stores/provider';
import type { PreferencesAccess } from 'compass-preferences-model';
import type { Logger } from '@mongodb-js/compass-logging/provider';
import type { TrackFunction } from '@mongodb-js/compass-telemetry';
import { type WorkspacesService } from '@mongodb-js/compass-workspaces/provider';

/**
 * The lowest supported version.
 */
const MIN_VERSION = '3.2.0';

export type SchemaValidationServices = {
  globalAppRegistry: AppRegistry;
  dataService: DataService;
  connectionInfoRef: ConnectionInfoRef;
  preferences: PreferencesAccess;
  instance: MongoDBInstance;
  logger: Logger;
  workspaces: WorkspacesService;
  track: TrackFunction;
};

// Exposed for testing
export function configureStore(
  state: Partial<RootState>,
  services: Pick<
    SchemaValidationServices,
    | 'globalAppRegistry'
    | 'workspaces'
    | 'dataService'
    | 'preferences'
    | 'logger'
    | 'track'
    | 'connectionInfoRef'
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
    globalAppRegistry,
    dataService,
    connectionInfoRef,
    preferences,
    instance,
    logger,
    workspaces,
    track,
  }: SchemaValidationServices,
  { on, cleanup, addCleanup }: ActivateHelpers
) {
  const store = configureStore(
    {
      namespace: toNS(options.namespace),
      serverVersion: instance.build.version,
      editMode: {
        collectionTimeSeries: !!options.isTimeSeries,
        collectionReadOnly: options.isReadonly ? true : false,
        writeStateStoreReadOnly: !instance.isWritable,
        oldServerReadOnly: semver.gte(MIN_VERSION, instance.build.version),
        isEditingEnabledByUser: false,
      },
    },
    {
      dataService,
      connectionInfoRef,
      preferences,
      globalAppRegistry,
      workspaces,
      logger,
      track,
    }
  );

  // isWritable can change later
  on(instance, 'change:isWritable', () => {
    store.dispatch(
      editModeChanged({
        writeStateStoreReadOnly: !instance.isWritable,
      })
    );
  });

  // Activate validation when this plugin is first rendered
  store.dispatch(activateValidation());

  const onCloseOrReplace = () => {
    return !store.getState().validation.isChanged;
  };

  addCleanup(workspaces.onTabReplace?.(onCloseOrReplace));

  addCleanup(workspaces.onTabClose?.(onCloseOrReplace));

  return {
    store,
    deactivate: cleanup,
  };
}
