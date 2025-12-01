import type { PreferencesAccess } from 'compass-preferences-model/provider';
import type { ConnectionsService } from '@mongodb-js/compass-connections/provider';
import type { TrackFunction } from '@mongodb-js/compass-telemetry/provider';
import type { Logger } from '@mongodb-js/compass-logging/provider';
import type { MongoDBInstancesManager } from '@mongodb-js/compass-app-stores/provider';
import type { DataModelStorageService } from '../provider';
import { applyMiddleware, createStore } from 'redux';
import reducer from './reducer';
import type { DataModelingExtraArgs } from './reducer';
import thunk from 'redux-thunk';
import type { ActivateHelpers } from '@mongodb-js/compass-app-registry';
import { openToast as _openToast } from '@mongodb-js/compass-components';

export type DataModelingStoreOptions = {
  openToast?: typeof _openToast;
};

export type DataModelingStoreServices = {
  preferences: PreferencesAccess;
  connections: ConnectionsService;
  instanceManager: MongoDBInstancesManager;
  dataModelStorage: DataModelStorageService;
  track: TrackFunction;
  logger: Logger;
};

export function activateDataModelingStore(
  { openToast = _openToast }: DataModelingStoreOptions,
  services: DataModelingStoreServices,
  { cleanup, addCleanup }: ActivateHelpers
) {
  const cancelAnalysisControllerRef: DataModelingExtraArgs['cancelAnalysisControllerRef'] =
    { current: null };
  const cancelExportControllerRef: DataModelingExtraArgs['cancelExportControllerRef'] =
    { current: null };
  const store = createStore(
    reducer,
    applyMiddleware(
      thunk.withExtraArgument<DataModelingExtraArgs>({
        ...services,
        cancelAnalysisControllerRef,
        cancelExportControllerRef,
        openToast,
      })
    )
  );

  addCleanup(() => {
    // Abort any ongoing analysis and exporting when deactivated.
    cancelAnalysisControllerRef.current?.abort();
    cancelExportControllerRef.current?.abort();
  });

  return { store, deactivate: cleanup };
}
