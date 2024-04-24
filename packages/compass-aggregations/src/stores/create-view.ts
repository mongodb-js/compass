import type { Action } from 'redux';
import { createStore, applyMiddleware } from 'redux';
import type { ThunkAction } from 'redux-thunk';
import thunk from 'redux-thunk';
import type { CreateViewAction } from '../modules/create-view';
import reducer, { open } from '../modules/create-view';
import type AppRegistry from 'hadron-app-registry';
import type { DataService } from 'mongodb-data-service';
import type { LoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';
import type { WorkspacesService } from '@mongodb-js/compass-workspaces/provider';
import type { ConnectionInfoAccess } from '@mongodb-js/compass-connections/provider';

type CreateViewServices = {
  globalAppRegistry: AppRegistry;
  dataService: Pick<DataService, 'createView'>;
  logger: LoggerAndTelemetry;
  workspaces: WorkspacesService;
  connectionInfoAccess: ConnectionInfoAccess;
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

export function activateCreateViewPlugin(
  _: unknown,
  {
    globalAppRegistry,
    dataService,
    logger,
    workspaces,
    connectionInfoAccess,
  }: CreateViewServices
) {
  const store = configureStore({
    globalAppRegistry,
    dataService,
    logger,
    workspaces,
    connectionInfoAccess,
  });

  const onOpenCreateView = (meta: {
    source: string;
    pipeline: any[];
    duplicate?: boolean;
  }) => {
    store.dispatch(open(meta.source, meta.pipeline, meta.duplicate ?? false));
  };

  globalAppRegistry.on('open-create-view', onOpenCreateView);

  return {
    store,
    deactivate(this: void) {
      globalAppRegistry.removeListener('open-create-view', onOpenCreateView);
    },
  };
}
