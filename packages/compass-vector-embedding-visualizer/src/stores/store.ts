import type { Store } from 'redux';
import { createStore } from 'redux';
import type { DataService } from 'mongodb-data-service';
import type { ConnectionInfoRef } from '@mongodb-js/compass-connections/provider';
import type {
  Collection,
  MongoDBInstance,
} from '@mongodb-js/compass-app-stores/provider';
import type AppRegistry from 'hadron-app-registry';
import type { Logger } from '@mongodb-js/compass-logging';
import type { TrackFunction } from '@mongodb-js/compass-telemetry';
import type { AtlasService } from '@mongodb-js/atlas-service/provider';
import type { PreferencesAccess } from 'compass-preferences-model';
import type { ActivateHelpers } from 'hadron-app-registry';

export type VectorDataServiceProps =
  | 'find'
  // Required for collection model (fetching stats)
  | 'collectionStats'
  | 'collectionInfo'
  | 'listCollections';
export type VectorDataService = Pick<DataService, VectorDataServiceProps>;

export type VectorPluginServices = {
  dataService: VectorDataService;
  connectionInfoRef: ConnectionInfoRef;
  instance: MongoDBInstance;
  localAppRegistry: Pick<AppRegistry, 'on' | 'emit' | 'removeListener'>;
  globalAppRegistry: Pick<AppRegistry, 'on' | 'emit' | 'removeListener'>;
  logger: Logger;
  collection: Collection;
  track: TrackFunction;
  atlasService: AtlasService;
  preferences: PreferencesAccess;
};

export type VectorPluginOptions = {
  namespace: string;
  serverVersion: string;
  isReadonly: boolean;
};

export type VectorPluginStore = Store;

function reducer(state = {}, _action: any) {
  return state;
}

export function activateVectorPlugin(
  _options: VectorPluginOptions,
  _services: VectorPluginServices,
  { cleanup }: ActivateHelpers
) {
  const store = createStore((state = {}) => state);
  return {
    store,
    deactivate: () => cleanup(),
  };
}
