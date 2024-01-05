import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import reducer from '../modules/create-index';
import { toggleIsVisible } from '../modules/is-visible';
import type { CollectionTabPluginMetadata } from '@mongodb-js/compass-collection';
import { type ActivateHelpers } from 'hadron-app-registry';
import type AppRegistry from 'hadron-app-registry';
import type { DataService } from 'mongodb-data-service';
import type { LoggerAndTelemetry } from '@mongodb-js/compass-logging';

type CreateIndexPluginOptions = Pick<
  CollectionTabPluginMetadata,
  'namespace' | 'serverVersion'
>;

export type CreateIndexPluginServices = {
  globalAppRegistry: AppRegistry;
  localAppRegistry: AppRegistry;
  dataService: Pick<DataService, 'createIndex'>;
  logger: LoggerAndTelemetry;
};

export function activatePlugin(
  { namespace, serverVersion }: CreateIndexPluginOptions,
  { localAppRegistry, dataService, logger }: CreateIndexPluginServices,
  { on, cleanup }: ActivateHelpers
) {
  const store = createStore(
    reducer,
    { namespace, serverVersion },
    applyMiddleware(
      thunk.withExtraArgument({ localAppRegistry, dataService, logger })
    )
  );

  on(localAppRegistry, 'open-create-index-modal', () => {
    store.dispatch(toggleIsVisible(true));
  });

  return { store, deactivate: cleanup };
}
