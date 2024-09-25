import { createStore, applyMiddleware, type Action } from 'redux';
import thunk from 'redux-thunk';
import type { ActivateHelpers } from 'hadron-app-registry';
import type { Logger } from '@mongodb-js/compass-logging';
import type { TrackFunction } from '@mongodb-js/compass-telemetry';
import type { ConnectionInfoRef } from '@mongodb-js/compass-connections/provider';
import type { CollectionTabPluginMetadata } from '@mongodb-js/compass-collection';
import type { AtlasService } from '@mongodb-js/atlas-service/provider';
import type { ThunkAction } from 'redux-thunk';

import reducer, { ShardingStatuses, type RootState } from './reducer';
import { AtlasGlobalWritesService } from '../services/atlas-global-writes-service';

type GlobalWritesExtraArgs = {
  logger: Logger;
  track: TrackFunction;
  connectionInfoRef: ConnectionInfoRef;
  atlasGlobalWritesService: AtlasGlobalWritesService;
};

export type GlobalWritesThunkAction<R, A extends Action> = ThunkAction<
  R,
  RootState,
  GlobalWritesExtraArgs,
  A
>;

type GlobalWritesPluginOptions = CollectionTabPluginMetadata;
type GlobalWritesPluginServices = Pick<
  GlobalWritesExtraArgs,
  'logger' | 'track' | 'connectionInfoRef'
> & {
  atlasService: AtlasService;
};

export function activateGlobalWritesPlugin(
  options: GlobalWritesPluginOptions,
  {
    connectionInfoRef,
    logger,
    track,
    atlasService,
  }: GlobalWritesPluginServices,
  { cleanup }: ActivateHelpers
) {
  const atlasGlobalWritesService = new AtlasGlobalWritesService(atlasService);
  const store = createStore(
    reducer,
    {
      namespace: options.namespace,
      isNamespaceSharded: false,
      status: ShardingStatuses.NOT_READY,
    },
    applyMiddleware(
      thunk.withExtraArgument({
        logger,
        track,
        connectionInfoRef,
        atlasGlobalWritesService,
      })
    )
  );

  return { store, deactivate: () => cleanup() };
}
