import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import reducer from '../modules/create-index';
import { toggleIsVisible } from '../modules/is-visible';
import type { CollectionTabPluginMetadata } from '@mongodb-js/compass-collection';
import { type ActivateHelpers } from 'hadron-app-registry';
import type AppRegistry from 'hadron-app-registry';
import type { DataService } from 'mongodb-data-service';
import type { Logger } from '@mongodb-js/compass-logging';
import type { TrackFunction } from '@mongodb-js/compass-telemetry';
import type { ConnectionInfoRef } from '@mongodb-js/compass-connections/provider';

type CreateIndexPluginOptions = Pick<
  CollectionTabPluginMetadata,
  'namespace' | 'serverVersion'
>;

export type CreateIndexPluginServices = {
  globalAppRegistry: AppRegistry;
  localAppRegistry: AppRegistry;
  dataService: Pick<DataService, 'createIndex'>;
  connectionInfoRef: ConnectionInfoRef;
  logger: Logger;
  track: TrackFunction;
};

export function activatePlugin(
  { namespace, serverVersion }: CreateIndexPluginOptions,
  {
    localAppRegistry,
    dataService,
    logger,
    track,
    connectionInfoRef,
  }: CreateIndexPluginServices,
  { on, cleanup }: ActivateHelpers
) {
  const store = createStore(
    reducer,
    { namespace, serverVersion },
    applyMiddleware(
      thunk.withExtraArgument({
        localAppRegistry,
        dataService,
        logger,
        track,
        connectionInfoRef,
      })
    )
  );

  on(localAppRegistry, 'open-create-index-modal', () => {
    store.dispatch(toggleIsVisible(true));
  });

  return { store, deactivate: cleanup };
}
