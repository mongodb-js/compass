import type { AnyAction, Action } from 'redux';
import { createStore, applyMiddleware } from 'redux';
import type { ThunkAction } from 'redux-thunk';
import thunk from 'redux-thunk';
import reducer, { open } from '../modules/create-view';
import type AppRegistry from 'hadron-app-registry';
import type { DataService } from 'mongodb-data-service';
import type { LoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';

type CreateViewServices = {
  globalAppRegistry: AppRegistry;
  dataService: Pick<DataService, 'createView'>;
  logger: LoggerAndTelemetry;
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
  A extends Action = AnyAction
> = ThunkAction<R, CreateViewRootState, CreateViewServices, A>;

export function activateCreateViewPlugin(
  _: unknown,
  { globalAppRegistry, dataService, logger }: CreateViewServices
) {
  const store = configureStore({ globalAppRegistry, dataService, logger });

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
