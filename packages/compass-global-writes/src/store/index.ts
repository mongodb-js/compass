import { createStore, applyMiddleware, type Action, type Store } from 'redux';
import thunk from 'redux-thunk';
import type { ActivateHelpers } from 'hadron-app-registry';
import type { Logger } from '@mongodb-js/compass-logging';
import type { TrackFunction } from '@mongodb-js/compass-telemetry';
import type { ConnectionInfoRef } from '@mongodb-js/compass-connections/provider';
import type { CollectionTabPluginMetadata } from '@mongodb-js/compass-collection';
import type { AtlasService } from '@mongodb-js/atlas-service/provider';
import type { ThunkAction, ThunkDispatch } from 'redux-thunk';

import reducer, {
  ShardingStatuses,
  fetchClusterShardingData,
  type RootState,
} from './reducer';
import { AtlasGlobalWritesService } from '../services/atlas-global-writes-service';

type GlobalWritesExtraArgs = {
  logger: Logger;
  track: TrackFunction;
  connectionInfoRef: ConnectionInfoRef;
  atlasGlobalWritesService: AtlasGlobalWritesService;
  pollingTimeoutRef: {
    current: ReturnType<typeof setTimeout> | null;
  };
};

export type GlobalWritesThunkAction<R, A extends Action> = ThunkAction<
  R,
  RootState,
  GlobalWritesExtraArgs,
  A
>;
export type GlobalWritesThunkDispatch<A extends Action = Action> =
  ThunkDispatch<RootState, GlobalWritesExtraArgs, A>;

export type GlobalWritesPluginOptions = Pick<
  CollectionTabPluginMetadata,
  'namespace'
>;
export type GlobalWritesPluginServices = Pick<
  GlobalWritesExtraArgs,
  'logger' | 'track' | 'connectionInfoRef'
> & {
  atlasService: AtlasService;
};

export type GlobalWritesStore = Store<RootState> & {
  dispatch: GlobalWritesThunkDispatch;
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
  const atlasGlobalWritesService = new AtlasGlobalWritesService(
    atlasService,
    connectionInfoRef
  );
  const pollingTimeoutRef = {
    current: null,
  };
  const store: GlobalWritesStore = createStore(
    reducer,
    {
      namespace: options.namespace,
      status: ShardingStatuses.NOT_READY,
      shardZones: [],
    },
    applyMiddleware(
      thunk.withExtraArgument({
        logger,
        track,
        connectionInfoRef,
        atlasGlobalWritesService,
        pollingTimeoutRef,
      })
    )
  );

  void store.dispatch(fetchClusterShardingData());

  return { store, deactivate: () => cleanup() };
}
