import { createStore, applyMiddleware } from 'redux';
import type { GlobalWritesExtraArgs } from './modules';
import reducer from './modules';
import thunk from 'redux-thunk';
import type { ActivateHelpers } from 'hadron-app-registry';
import type { Logger } from '@mongodb-js/compass-logging';
import type { TrackFunction } from '@mongodb-js/compass-telemetry';
import type { ConnectionInfoRef } from '@mongodb-js/compass-connections/provider';
import type { CollectionTabPluginMetadata } from '@mongodb-js/compass-collection';

type GlobalWritesPluginOptions = CollectionTabPluginMetadata;

type GlobalWritesPluginServices = {
  connectionInfoRef: ConnectionInfoRef;
  logger: Logger;
  track: TrackFunction;
};

export function activateGlobalWritesPlugin(
  options: GlobalWritesPluginOptions,
  { connectionInfoRef, logger, track }: GlobalWritesPluginServices,
  { cleanup }: ActivateHelpers
) {
  const store = createStore(
    reducer,
    {
      namespace: options.namespace,
    },
    applyMiddleware(
      thunk.withExtraArgument<GlobalWritesExtraArgs>({
        logger,
        track,
        connectionInfoRef,
      })
    )
  );

  return { store, deactivate: () => cleanup() };
}
