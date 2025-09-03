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

export type DataModelingStoreOptions = Record<string, unknown>;

export type DataModelingStoreServices = {
  preferences: PreferencesAccess;
  connections: ConnectionsService;
  instanceManager: MongoDBInstancesManager;
  dataModelStorage: DataModelStorageService;
  track: TrackFunction;
  logger: Logger;
};

export function activateDataModelingStore(
  _: DataModelingStoreOptions,
  services: DataModelingStoreServices,
  { cleanup }: ActivateHelpers
) {
  const cancelAnalysisControllerRef = { current: null };
  const cancelExportControllerRef = { current: null };
  const store = createStore(
    reducer,
    applyMiddleware(
      thunk.withExtraArgument<DataModelingExtraArgs>({
        ...services,
        cancelAnalysisControllerRef,
        cancelExportControllerRef,
      })
    )
  );
  return { store, deactivate: cleanup };
}
