import { applyMiddleware, createStore } from 'redux';
import type { DataService } from 'mongodb-data-service';
// import type { ConnectionInfoRef } from '@mongodb-js/compass-connections/provider';
import type {
  Collection,
  // MongoDBInstance,
} from '@mongodb-js/compass-app-stores/provider';
// import type AppRegistry from 'hadron-app-registry';
import type { Logger } from '@mongodb-js/compass-logging';
// import type { TrackFunction } from '@mongodb-js/compass-telemetry';
// import type { AtlasService } from '@mongodb-js/atlas-service/provider';
// import type { PreferencesAccess } from 'compass-preferences-model';
import type { ActivateHelpers } from 'hadron-app-registry';
import thunk from 'redux-thunk';

import reducer from './reducer';

export type VectorDataServiceProps =
  | 'find'
  // Required for collection model (fetching stats)
  | 'collectionStats'
  | 'collectionInfo'
  | 'listCollections';
export type VectorDataService = Pick<DataService, VectorDataServiceProps>;

export type VectorPluginServices = {
  dataService: VectorDataService;
  logger: Logger;
  collection: Collection;

  // Note(Rhys): If we want more of these services, we can uncomment,
  // and then in ../index.ts, we add them as well.

  // connectionInfoRef: ConnectionInfoRef;
  // instance: MongoDBInstance;
  // localAppRegistry: Pick<AppRegistry, 'on' | 'emit' | 'removeListener'>;
  // globalAppRegistry: Pick<AppRegistry, 'on' | 'emit' | 'removeListener'>;
  // track: TrackFunction;
  // atlasService: AtlasService;
  // preferences: PreferencesAccess;
};

// export type VectorPluginOptions = {
//   namespace: string;
//   serverVersion: string;
//   isReadonly: boolean;
// };
export type VectorPluginOptions = Record<string, unknown>;

export function activateVectorPlugin(
  _options: VectorPluginOptions,
  services: VectorPluginServices,
  { cleanup }: ActivateHelpers
) {
  const cancelControllerRef = { current: null };
  const store = createStore(
    reducer,
    applyMiddleware(
      thunk.withExtraArgument({ ...services, cancelControllerRef })
    )
  );
  return { store, deactivate: cleanup };
}
