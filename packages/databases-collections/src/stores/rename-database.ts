import { legacy_createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import type AppRegistry from '@mongodb-js/compass-app-registry';
import type { ConnectionsService } from '@mongodb-js/compass-connections/provider';
import reducer, { open } from '../modules/rename-database/rename-database';
import type {
  FavoriteQueryStorageAccess,
  PipelineStorageAccess,
} from '@mongodb-js/my-queries-storage/provider';
import { type MongoDBInstancesManager } from '@mongodb-js/compass-app-stores/provider';
import type { ActivateHelpers } from '@mongodb-js/compass-app-registry';

export type RenameDatabasePluginServices = {
  globalAppRegistry: AppRegistry;
  connections: ConnectionsService;
  instancesManager: MongoDBInstancesManager;
  queryStorage?: FavoriteQueryStorageAccess;
  pipelineStorage?: PipelineStorageAccess;
};

export function activateRenameDatabasePlugin(
  _: unknown,
  {
    globalAppRegistry,
    connections,
    instancesManager,
    queryStorage,
    pipelineStorage,
  }: RenameDatabasePluginServices,
  { cleanup, on }: ActivateHelpers
) {
  async function checkIfSavedQueriesAndAggregationsExist(
    databaseName: string
  ): Promise<boolean> {
    const prefix = `${databaseName}.`;
    const pipelineExists = await pipelineStorage
      ?.getStorage()
      .loadAll()
      .then((pipelines) =>
        pipelines.some(({ namespace }) => namespace?.startsWith(prefix))
      )
      .catch(() => false);
    const queryExists = await queryStorage
      ?.getStorage()
      .loadAll()
      .then((queries) => queries.some(({ _ns }) => _ns?.startsWith(prefix)))
      .catch(() => false);

    return Boolean(pipelineExists || queryExists);
  }

  const store = legacy_createStore(
    reducer,
    applyMiddleware(
      thunk.withExtraArgument({
        globalAppRegistry,
        instancesManager,
        connections,
      })
    )
  );

  on(
    globalAppRegistry,
    'open-rename-database',
    (
      databaseName: string,
      { connectionId }: { connectionId?: string } = {}
    ) => {
      if (!connectionId) {
        throw new Error(
          'Cannot rename a database without specifying connectionId'
        );
      }

      const instance =
        instancesManager.getMongoDBInstanceForConnection(connectionId);

      const databases: { name: string }[] = instance.databases.map(
        ({ name }: { name: string }) => ({ name })
      );
      const database = instance.databases.get(databaseName);
      const collections = database?.collections ?? [];
      const collectionCount = collections.length;
      const hasViews = collections.some(
        (c: { type?: string }) => c.type === 'view'
      );

      void checkIfSavedQueriesAndAggregationsExist(databaseName).then(
        (areSavedQueriesAndAggregationsImpacted) => {
          store.dispatch(
            open({
              connectionId,
              db: databaseName,
              databases,
              collectionCount,
              hasViews,
              areSavedQueriesAndAggregationsImpacted,
            })
          );
        }
      );
    }
  );

  return {
    store,
    deactivate: cleanup,
  };
}
