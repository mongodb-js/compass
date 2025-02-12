import type { Logger } from '@mongodb-js/compass-logging';
import {
  createStore,
  applyMiddleware,
  type AnyAction,
  combineReducers,
} from 'redux';
import thunk, { type ThunkDispatch, type ThunkAction } from 'redux-thunk';
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
import type { SchemaAccessor } from 'mongodb-schema';
import {
  schemaAnalysisReducer,
  handleSchemaShare,
  stopAnalysis,
} from './schema-analysis-reducer';
import {
  cancelExportSchema,
  schemaExportReducer,
} from './schema-export-reducer';
import type { InternalLayer } from '../modules/geo';

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

export const rootReducer = combineReducers({
  schemaAnalysis: schemaAnalysisReducer,
  schemaExport: schemaExportReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export type SchemaExtraArgs = SchemaPluginServices & {
  analysisAbortControllerRef: { current?: AbortController };
  exportAbortControllerRef: { current?: AbortController };
  schemaAccessorRef: { current?: SchemaAccessor };
  geoLayersRef: { current: Record<string, InternalLayer> };
  namespace: string;
};
export type SchemaThunkAction<R, A extends AnyAction = AnyAction> = ThunkAction<
  R,
  RootState,
  SchemaExtraArgs,
  A
>;
export type SchemaThunkDispatch<A extends AnyAction = AnyAction> =
  ThunkDispatch<RootState, SchemaExtraArgs, A>;

/**
 * Configure a store with the provided options.
 *
 * @param {Object} options - The options.
 *
 * @returns {Store} The redux store.
 */
export function activateSchemaPlugin(
  { namespace }: Pick<CollectionTabPluginMetadata, 'namespace'>,
  services: SchemaPluginServices,
  { on, cleanup, addCleanup }: ActivateHelpers
) {
  const store = configureStore(services, namespace);
  /**
   * When `Share Schema as JSON` clicked in menu show a dialog message.
   */

  on(services.localAppRegistry, 'menu-share-schema-json', () =>
    store.dispatch(handleSchemaShare())
  );

  addCleanup(() => store.dispatch(stopAnalysis()));
  addCleanup(() => store.dispatch(cancelExportSchema()));

  return {
    store,
    deactivate() {
      cleanup();
    },
  };
}

export function configureStore(
  services: SchemaPluginServices,
  namespace: string
) {
  const analysisAbortControllerRef = {
    current: undefined,
  };
  const exportAbortControllerRef = {
    current: undefined,
  };
  const schemaAccessorRef = {
    current: undefined,
  };
  const geoLayersRef: { current: Record<string, InternalLayer> } = {
    current: {},
  };
  const store = createStore(
    rootReducer,
    applyMiddleware(
      thunk.withExtraArgument({
        ...services,
        analysisAbortControllerRef,
        exportAbortControllerRef,
        schemaAccessorRef,
        geoLayersRef,
        namespace,
      })
    )
  );
  return store;
}

export type SchemaStore = ReturnType<typeof configureStore>;
