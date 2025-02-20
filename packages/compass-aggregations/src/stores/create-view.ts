import type { Action } from 'redux';
import { createStore, applyMiddleware } from 'redux';
import type { ThunkAction } from 'redux-thunk';
import thunk from 'redux-thunk';
import type { CreateViewAction } from '../modules/create-view';
import reducer, { open } from '../modules/create-view';
import type AppRegistry from 'hadron-app-registry';
import type { Logger } from '@mongodb-js/compass-logging/provider';
import type { WorkspacesService } from '@mongodb-js/compass-workspaces/provider';
import type { ConnectionsService } from '@mongodb-js/compass-connections/provider';
import type { ActivateHelpers } from 'hadron-app-registry';
import type { TrackFunction } from '@mongodb-js/compass-telemetry';

type CreateViewServices = {
  globalAppRegistry: AppRegistry;
  connections: ConnectionsService;
  logger: Logger;
  track: TrackFunction;
  workspaces: WorkspacesService;
};

export function configureStore(services: CreateViewServices) {
  return createStore(
    reducer,
    applyMiddleware(thunk.withExtraArgument(services))
  );
}

export type CreateViewRootState = ReturnType<
  ReturnType<typeof configureStore>['getState']
>;

export type CreateViewThunkAction<
  R,
  A extends Action = CreateViewAction
> = ThunkAction<R, CreateViewRootState, CreateViewServices, A>;

type OpenCreateViewEventParams = {
  source: string;
  pipeline: any[];
  duplicate?: boolean;
};

type ConnectionMeta = {
  connectionId?: string;
};

export function activateCreateViewPlugin(
  _: unknown,
  {
    globalAppRegistry,
    connections,
    logger,
    track,
    workspaces,
  }: CreateViewServices,
  { on, cleanup }: ActivateHelpers
) {
  const store = configureStore({
    globalAppRegistry,
    connections,
    logger,
    track,
    workspaces,
  });

  on(
    globalAppRegistry,
    'open-create-view',
    function (
      eventParams: OpenCreateViewEventParams,
      connectionMeta: ConnectionMeta = {}
    ) {
      if (!connectionMeta.connectionId) {
        throw new Error('Cannot open CreateViewModal without a connectionId');
      }

      store.dispatch(
        open({
          connectionId: connectionMeta.connectionId,
          sourceNs: eventParams.source,
          sourcePipeline: eventParams.pipeline,
          duplicate: eventParams.duplicate ?? false,
        })
      );
    }
  );

  return {
    store,
    deactivate: cleanup,
  };
}
