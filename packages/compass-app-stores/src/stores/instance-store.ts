import type { MongoDBInstanceProps } from 'mongodb-instance-model';
import { MongoDBInstance } from 'mongodb-instance-model';
import toNS from 'mongodb-ns';
import type { DataService } from '@mongodb-js/compass-connections/provider';
import type { ActivateHelpers, AppRegistry } from 'hadron-app-registry';
import type { Logger } from '@mongodb-js/compass-logging/provider';
import { openToast } from '@mongodb-js/compass-components';
import {
  ConnectionsManagerEvents,
  type ConnectionsManager,
} from '@mongodb-js/compass-connections/provider';
import { MongoDBInstancesManager } from '../instances-manager';

function serversArray(
  serversMap: NonNullable<
    ReturnType<DataService['getLastSeenTopology']>
  >['servers']
) {
  const servers = [];

  for (const desc of serversMap.values()) {
    servers.push({
      address: desc.address,
      type: desc.type,
      tags: desc.tags,
    });
  }

  return servers;
}

function getTopologyDescription(
  topologyDescription: ReturnType<DataService['getLastSeenTopology']>
): MongoDBInstance['topologyDescription'] | undefined {
  if (!topologyDescription) return undefined;
  return {
    type: topologyDescription.type,
    servers: serversArray(topologyDescription.servers),
    setName: topologyDescription.setName,
  };
}

export function createInstancesStore(
  {
    globalAppRegistry,
    connectionsManager,
    logger: { log, mongoLogId },
  }: {
    connectionsManager: ConnectionsManager;
    logger: Logger;
    globalAppRegistry: AppRegistry;
  },
  { on, cleanup, addCleanup }: ActivateHelpers
) {
  const instancesManager = new MongoDBInstancesManager();
  on(
    connectionsManager,
    ConnectionsManagerEvents.ConnectionDisconnected,
    function (connectionInfoId: string) {
      instancesManager.removeMongoDBInstanceForConnection(connectionInfoId);
    }
  );

  on(
    connectionsManager,
    ConnectionsManagerEvents.ConnectionAttemptSuccessful,
    function (instanceConnectionId: string, dataService: DataService) {
      async function refreshInstance(
        refreshOptions: Omit<
          Parameters<MongoDBInstance['refresh']>[0],
          'dataService'
        > = {}
      ) {
        const isFirstRun = instance.status === 'initial';

        try {
          await instance.refresh({ dataService, ...refreshOptions });
        } catch (err: any) {
          log.warn(
            mongoLogId(1_001_000_295),
            'Instance Store',
            'Failed to refresh instance',
            {
              message: (err as Error).message,
              connectionId: dataService.id,
              isFirstRun,
            }
          );
          // The `instance.refresh` method is catching all expected errors: we treat
          // a lot of metadata as optional so failing to fetch it shouldn't throw.
          // In most cases if this failed on subsequent runs, user is probably
          // already in a state that will show them a more specified error (like
          // seeing some server error trying to refresh collection list in cases
          // that something happened with the server after connection). However if
          // we are fetching instance info for the first time (as indicated by the
          // initial instance status) and we ended up here, there might be no other
          // place for the user to see the error. This is a very rare case, but we
          // don't want to leave the user without any indication that something went
          // wrong and so we show an toast with the error message
          if (isFirstRun) {
            const { name, message } = err as Error;
            openToast('instance-refresh-failed', {
              title: 'Failed to retrieve server info',
              description: `${name}: ${message}`,
              variant: 'important',
            });
          }
        }
      }

      // Event emitted when the Databases grid needs to be refreshed. We
      // additionally refresh the list of collections as well since there is the
      // side navigation which could be in expanded mode
      async function refreshDatabases({
        connectionId,
      }: {
        connectionId: string;
      }) {
        if (instanceConnectionId !== connectionId) {
          return;
        }

        try {
          await instance.fetchDatabases({ dataService, force: true });
          await Promise.allSettled(
            instance.databases.map((db) =>
              db.fetchCollections({ dataService, force: true })
            )
          );
        } catch (err: any) {
          log.warn(
            mongoLogId(1_001_000_296),
            'Instance Store',
            'Failed to refresh databases',
            {
              message: (err as Error).message,
              connectionId: dataService.id,
            }
          );
        }
      }

      async function fetchAllCollections() {
        // It is possible to get here before the databases finished loading. We have
        // to wait for the databases, otherwise it will load all the collections for
        // 0 databases.
        await instance.fetchDatabases({ dataService });
        await Promise.all(
          instance.databases.map((db) => {
            return db.fetchCollections({ dataService });
          })
        );
      }

      async function refreshNamespaceStats(
        { ns }: { ns: string },
        { connectionId }: { connectionId?: string } = {}
      ) {
        if (connectionId !== instanceConnectionId) {
          return;
        }

        const { database } = toNS(ns);
        const db = instance.databases.get(database);
        const coll = db?.collections.get(ns);
        // We don't care if this fails
        await Promise.allSettled([
          db?.fetch({ dataService, force: true }),
          coll?.fetch({ dataService, force: true }),
        ]);
      }

      // A shared method that will add new namespace model to the instance model if
      // it doesn't exist yet and will call refresh methods on the database and
      // collection models
      async function maybeAddAndRefreshCollectionModel(namespace: string) {
        const { database } = toNS(namespace);
        const db =
          instance.databases.get(database) ??
          // We might be adding collection to a new db namespace
          instance.databases.add({ _id: database });
        // We might be refreshing an existing namespace (in case of out stages usage
        // for example)
        let newCollection = false;
        let coll = db.collections.get(namespace, '_id');
        if (!coll) {
          newCollection = true;
          coll = db.collections.add({ _id: namespace });
        }
        // We don't care if this fails
        await Promise.allSettled([
          db.fetch({ dataService, force: true }),
          coll.fetch({
            dataService,
            force: true,
            // We only need to fetch info in case of new collection being created
            fetchInfo: newCollection,
          }),
        ]);
      }

      const connectionString = dataService.getConnectionString();
      const firstHost = connectionString.hosts[0] || '';
      const [hostname, port] = firstHost.split(':');

      const initialInstanceProps: Partial<MongoDBInstanceProps> = {
        _id: firstHost,
        hostname: hostname,
        port: port ? +port : undefined,
        topologyDescription: getTopologyDescription(
          dataService.getLastSeenTopology()
        ),
      };
      const instance = instancesManager.createMongoDBInstanceForConnection(
        instanceConnectionId,
        initialInstanceProps as MongoDBInstanceProps
      );

      addCleanup(() => {
        instance.removeAllListeners();
      });

      void refreshInstance({
        fetchDatabases: true,
        fetchDbStats: true,
      });

      function onTopologyDescriptionChanged({
        newDescription,
      }: {
        newDescription: ReturnType<DataService['getLastSeenTopology']>;
      }) {
        instance.set({
          topologyDescription: getTopologyDescription(newDescription),
        });
      }

      on(
        dataService,
        'topologyDescriptionChanged',
        onTopologyDescriptionChanged
      );

      on(
        globalAppRegistry,
        'sidebar-expand-database',
        (connectionId: string, databaseId: string) => {
          if (connectionId !== instanceConnectionId) {
            return;
          }
          void instance.databases
            .get(databaseId)
            ?.fetchCollections({ dataService });
        }
      );

      on(
        globalAppRegistry,
        'sidebar-filter-navigation-list',
        fetchAllCollections
      );

      on(globalAppRegistry, 'refresh-data', refreshInstance);

      on(
        globalAppRegistry,
        'database-dropped',
        (dbName: string, { connectionId }: { connectionId?: string } = {}) => {
          if (connectionId !== instanceConnectionId) {
            return;
          }

          const db = instance.databases.remove(dbName);
          if (db) {
            MongoDBInstance.removeAllListeners(db);
          }
        }
      );

      on(
        globalAppRegistry,
        'collection-dropped',
        (
          namespace: string,
          { connectionId }: { connectionId?: string } = {}
        ) => {
          if (connectionId !== instanceConnectionId) {
            return;
          }

          const { database } = toNS(namespace);
          const db = instance.databases.get(database);
          const coll = db?.collections.get(namespace, '_id');

          if (!db || !coll) {
            return;
          }

          const isLastCollection = db.collections.length === 1;

          if (isLastCollection) {
            instance.databases.remove(db);
            MongoDBInstance.removeAllListeners(db);
          } else {
            db.collections.remove(coll);
            MongoDBInstance.removeAllListeners(coll);
            // Update db stats to account for db stats affected by collection stats
            void db?.fetch({ dataService, force: true }).catch(() => {
              // noop, we ignore stats fetching failures
            });
          }
        }
      );

      on(globalAppRegistry, 'refresh-databases', refreshDatabases);

      on(
        globalAppRegistry,
        'collection-renamed',
        (
          { from, to }: { from: string; to: string },
          { connectionId }: { connectionId?: string } = {}
        ) => {
          if (connectionId !== instanceConnectionId) {
            return;
          }

          const { database, collection } = toNS(from);
          instance.databases
            .get(database)
            ?.collections.get(collection, 'name')
            ?.set({ _id: to });
        }
      );

      on(globalAppRegistry, 'document-deleted', refreshNamespaceStats);
      on(globalAppRegistry, 'document-inserted', refreshNamespaceStats);
      on(globalAppRegistry, 'import-finished', refreshNamespaceStats);

      on(
        globalAppRegistry,
        'collection-created',
        (ns: string, { connectionId }: { connectionId?: string } = {}) => {
          if (connectionId === instanceConnectionId) {
            void maybeAddAndRefreshCollectionModel(ns);
          }
        }
      );

      on(
        globalAppRegistry,
        'view-created',
        (ns: string, { connectionId }: { connectionId?: string } = {}) => {
          if (connectionId === instanceConnectionId) {
            void maybeAddAndRefreshCollectionModel(ns);
          }
        }
      );

      on(
        globalAppRegistry,
        'agg-pipeline-out-executed',
        // null means the out / merge stage destination wasn't a namespace in the
        // same cluster
        (namespace: string | null) => {
          if (!namespace) {
            return;
          }
          void maybeAddAndRefreshCollectionModel(namespace);
        }
      );

      on(globalAppRegistry, 'view-edited', (namespace: string) => {
        const { database } = toNS(namespace);
        void instance.databases
          .get(database)
          ?.collections.get(namespace, '_id')
          ?.fetch({ dataService, force: true });
      });
    }
  );

  return {
    state: { instancesManager }, // Using LegacyRefluxProvider here to pass state to provider
    getState() {
      return { instancesManager };
    },
    deactivate: cleanup,
  };
}
