import { legacy_createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import type AppRegistry from 'hadron-app-registry';
import type {
  ConnectionScopedAppRegistry,
  ConnectionsManager,
} from '@mongodb-js/compass-connections/provider';
import reducer, { open } from '../modules/rename-collection/rename-collection';
import type {
  FavoriteQueryStorageAccess,
  PipelineStorage,
} from '@mongodb-js/my-queries-storage/provider';
import { type MongoDBInstancesManager } from '@mongodb-js/compass-app-stores/provider';
import type { ActivateHelpers } from 'hadron-app-registry';

export type RenameCollectionPluginServices = {
  globalAppRegistry: AppRegistry;
  connectionsManager: ConnectionsManager;
  instancesManager: MongoDBInstancesManager;
  queryStorage?: FavoriteQueryStorageAccess;
  pipelineStorage?: PipelineStorage;
  connectionScopedAppRegistry: ConnectionScopedAppRegistry<'collection-renamed'>;
};

export function activateRenameCollectionPlugin(
  _: unknown,
  {
    globalAppRegistry,
    connectionsManager,
    instancesManager,
    queryStorage,
    pipelineStorage,
    connectionScopedAppRegistry,
  }: RenameCollectionPluginServices,
  { cleanup, on }: ActivateHelpers
) {
  async function checkIfSavedQueriesAndAggregationsExist(
    oldNamespace: string
  ): Promise<boolean> {
    const pipelineExists = await pipelineStorage
      ?.loadAll()
      .then((pipelines) =>
        pipelines.some(({ namespace }) => namespace === oldNamespace)
      )
      .catch(() => false);
    const queryExists = await queryStorage
      ?.getStorage()
      .loadAll()
      .then((queries) => queries.some(({ _ns }) => _ns === oldNamespace))
      .catch(() => false);

    return Boolean(pipelineExists || queryExists);
  }

  const store = legacy_createStore(
    reducer,
    applyMiddleware(
      thunk.withExtraArgument({
        globalAppRegistry,
        instancesManager,
        connectionsManager,
        connectionScopedAppRegistry,
      })
    )
  );

  on(
    globalAppRegistry,
    'open-rename-collection',
    (
      ns: { database: string; collection: string },
      { connectionId }: { connectionId?: string } = {}
    ) => {
      if (!connectionId) {
        throw new Error(
          'Cannot rename a namespace without specifying connectionId'
        );
      }

      const instance =
        instancesManager.getMongoDBInstanceForConnection(connectionId);
      if (!instance) {
        throw new Error(
          'unreachable: this modal is only shown when the connection is open.'
        );
      }

      const collections: { name: string }[] =
        instance.databases.get(ns.database)?.collections ?? [];
      void checkIfSavedQueriesAndAggregationsExist(
        `${ns.database}.${ns.collection}`
      ).then((areSavedQueriesAndAggregationsImpacted) => {
        store.dispatch(
          open({
            connectionId,
            db: ns.database,
            collection: ns.collection,
            collections,
            areSavedQueriesAndAggregationsImpacted,
          })
        );
      });
    }
  );

  return {
    store,
    deactivate: cleanup,
  };
}
