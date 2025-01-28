import type { Logger } from '@mongodb-js/compass-logging';
import { createStore, applyMiddleware, type AnyAction } from 'redux';
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
import reducer, { handleSchemaShare, stopAnalysis } from './reducer';
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

export type RootState = ReturnType<typeof reducer>;
export type SchemaExtraArgs = SchemaPluginServices & {
  abortControllerRef: { current?: AbortController };
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
  const abortControllerRef = {
    current: undefined,
  };
  const geoLayersRef: { current: Record<string, InternalLayer> } = {
    current: {},
  };
  const store = createStore(
    reducer,
    applyMiddleware(
      thunk.withExtraArgument({
        ...services,
        abortControllerRef,
        geoLayersRef,
        namespace,
      })
    )
  );
  return store;
}

export type SchemaStore = ReturnType<typeof configureStore>;
