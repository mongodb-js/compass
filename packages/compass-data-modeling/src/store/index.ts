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
import type { SchemaBuilderService } from './analysis-process';
import { defaultSchemaBuilderService } from './analysis-process';

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
  /**
   * Optional schema builder service. If not provided, uses the default WASM-based
   * implementation. This allows tests to provide a mock implementation.
   */
  schemaBuilder?: SchemaBuilderService;
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

  // Use provided schema builder service or fall back to default WASM-based implementation
  const schemaBuilder = services.schemaBuilder ?? defaultSchemaBuilderService;

  const store = createStore(
    reducer,
    applyMiddleware(
      thunk.withExtraArgument<DataModelingExtraArgs>({
        ...services,
        schemaBuilder,
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
