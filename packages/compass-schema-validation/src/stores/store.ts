import type { Store } from 'redux';
import { createStore, applyMiddleware } from 'redux';
import type { ThunkDispatch } from 'redux-thunk';
import thunk from 'redux-thunk';
import type { RootAction, RootState } from '../modules';
import reducer from '../modules';
import toNS from 'mongodb-ns';
import { namespaceChanged } from '../modules/namespace';
import { dataServiceConnected } from '../modules/data-service';
import { fieldsChanged } from '../modules/fields';
import { serverVersionChanged } from '../modules/server-version';
import { activateValidation } from '../modules/validation';
import { editModeChanged } from '../modules/edit-mode';
import {
  localAppRegistryActivated,
  globalAppRegistryActivated,
} from '@mongodb-js/mongodb-redux-common/app-registry';
import semver from 'semver';
import type { CollectionTabPluginMetadata } from '@mongodb-js/compass-collection';
import type { AppRegistry } from 'hadron-app-registry';
import type { DataService } from 'mongodb-data-service';
import type { MongoDBInstance } from '@mongodb-js/compass-app-stores/provider';

/**
 * The lowest supported version.
 */
const MIN_VERSION = '3.2.0';

// Exposed for testing
export function configureStore(): Store<RootState, RootAction> {
  return createStore(reducer, applyMiddleware(thunk));
}

/**
 * The store has a combined pipeline reducer plus the thunk middleware.
 */
export function onActivated(
  options: CollectionTabPluginMetadata,
  {
    localAppRegistry,
    globalAppRegistry,
    dataService,
    instance,
  }: {
    localAppRegistry: AppRegistry;
    globalAppRegistry: AppRegistry;
    dataService: DataService;
    instance: MongoDBInstance;
  }
) {
  const store = configureStore();
  const cleanup: (() => void)[] = [];
  function on(
    eventEmitter: {
      on(ev: string, l: (...args: any[]) => void): void;
      removeListener(ev: string, l: (...args: any[]) => void): void;
    },
    ev: string,
    listener: (...args: any[]) => void
  ) {
    eventEmitter.on(ev, listener);
    cleanup.push(() => eventEmitter.removeListener(ev, listener));
  }

  // Set the app registry if preset. This must happen first.
  store.dispatch(localAppRegistryActivated(localAppRegistry));
  store.dispatch(globalAppRegistryActivated(globalAppRegistry));
  store.dispatch(serverVersionChanged(instance.build.version));
  store.dispatch(dataServiceConnected(dataService));

  /**
   * When the collection is changed, update the store.
   */
  on(localAppRegistry, 'fields-changed', (fields) => {
    store.dispatch(fieldsChanged(fields.fields));
  });

  const setEditMode = () => {
    store.dispatch(
      editModeChanged({
        collectionTimeSeries: !!options.isTimeSeries,
        collectionReadOnly: options.isReadonly ? true : false,
        writeStateStoreReadOnly: !instance.isWritable,
        oldServerReadOnly: semver.gte(MIN_VERSION, instance.build.version),
      })
    );
  };

  // set the initial value
  setEditMode();

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
  (store.dispatch as ThunkDispatch<RootState, unknown, RootAction>)(
    activateValidation()
  );

  return {
    store,
    deactivate() {
      for (const cleaner of cleanup) cleaner();
    },
  };
}
