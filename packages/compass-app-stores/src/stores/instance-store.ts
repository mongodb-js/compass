import type { MongoDBInstanceProps } from 'mongodb-instance-model';
import { MongoDBInstance } from 'mongodb-instance-model';
import toNS from 'mongodb-ns';
import type {
  ConnectionsService,
  DataService,
} from '@mongodb-js/compass-connections/provider';
import type { ActivateHelpers, AppRegistry } from 'hadron-app-registry';
import type { Logger } from '@mongodb-js/compass-logging/provider';
import { openToast } from '@mongodb-js/compass-components';
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
    connections,
    logger: { log, mongoLogId },
  }: {
    connections: ConnectionsService;
    logger: Logger;
    globalAppRegistry: AppRegistry;
  },
  { on, cleanup, addCleanup }: ActivateHelpers
) {
  const instancesManager = new MongoDBInstancesManager();

  const fetchAllCollections = async ({
    connectionId,
  }: { connectionId?: string } = {}) => {
    try {
      if (!connectionId) {
        throw new Error('No connectionId provided');
      }
      const instance =
        instancesManager.getMongoDBInstanceForConnection(connectionId);
      const dataService = connections.getDataServiceForConnection(connectionId);
      // It is possible to get here before the databases finished loading. We have
      // to wait for the databases, otherwise it will load all the collections for
      // 0 databases.
      await instance.fetchDatabases({ dataService });
      await Promise.all(
        instance.databases.map((db) => {
          return db.fetchCollections({ dataService });
        })
      );
    } catch (error) {
      log.warn(
        mongoLogId(1_001_000_324),
        'Instance Store',
        'Failed to respond to fetch all collections',
        {
          message: (error as Error).message,
          connectionId: connectionId,
        }
      );
    }
  };

  const refreshInstance = async (
    refreshOptions: Omit<
      Parameters<MongoDBInstance['refresh']>[0],
      'dataService'
    > = {},
    { connectionId }: { connectionId?: string } = {}
  ) => {
    let isFirstRun: boolean | undefined;

    try {
      if (!connectionId) {
        throw new Error('No connectionId provided');
      }
      const instance =
        instancesManager.getMongoDBInstanceForConnection(connectionId);
      const dataService = connections.getDataServiceForConnection(connectionId);
      isFirstRun = instance.status === 'initial';
      await instance.refresh({ dataService, ...refreshOptions });
    } catch (err: any) {
      log.warn(
        mongoLogId(1_001_000_295),
        'Instance Store',
        'Failed to refresh instance',
        {
          message: (err as Error).message,
          connectionId: connectionId,
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
  };

  // Event emitted when the Databases grid needs to be refreshed. We
  // additionally refresh the list of collections as well since there is the
  // side navigation which could be in expanded mode
  const refreshDatabases = async ({
    connectionId,
  }: { connectionId?: string } = {}) => {
    try {
      if (!connectionId) {
        throw new Error('No connectionId provided in the event parameters');
      }
      const instance =
        instancesManager.getMongoDBInstanceForConnection(connectionId);
      const dataService = connections.getDataServiceForConnection(connectionId);
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
          connectionId: connectionId,
        }
      );
    }
  };

  const refreshNamespaceStats = async (
    { ns }: { ns: string },
    { connectionId }: { connectionId?: string } = {}
  ) => {
    try {
      if (!connectionId) {
        throw new Error('No connectionId provided in the event parameters');
      }
      const instance =
        instancesManager.getMongoDBInstanceForConnection(connectionId);
      const dataService = connections.getDataServiceForConnection(connectionId);
      const { database } = toNS(ns);
      const db = instance.databases.get(database);
      const coll = db?.collections.get(ns);
      // We don't care if this fails
      await Promise.allSettled([
        db?.fetch({ dataService, force: true }),
        coll?.fetch({ dataService, force: true }),
      ]);
    } catch (error) {
      log.warn(
        mongoLogId(1_001_000_319),
        'Instance Store',
        'Failed to refresh databases',
        {
          message: (error as Error).message,
          connectionId: connectionId,
        }
      );
    }
  };

  // A shared method that will add new namespace model to the instance model if
  // it doesn't exist yet and will call refresh methods on the database and
  // collection models
  const maybeAddAndRefreshCollectionModel = async (
    namespace: string,
    { connectionId }: { connectionId?: string } = {}
  ) => {
    try {
      if (!connectionId) {
        throw new Error('connectionId not provided');
      }
      const instance =
        instancesManager.getMongoDBInstanceForConnection(connectionId);
      const dataService = connections.getDataServiceForConnection(connectionId);
      const { database } = toNS(namespace);
      const db =
        instance.databases.get(database) ??
        // We might be adding collection to a new db namespace
        instance.databases.add({ _id: database, name: database });
      // We might be refreshing an existing namespace (in case of out stages usage
      // for example)
      let newCollection = false;
      let coll = db.collections.get(namespace, '_id');
      if (!coll) {
        newCollection = true;
        coll = db.collections.add({ _id: namespace });
      }
      // Fetch in sequence to avoid race conditions between database and
      // collection model updates
      await db
        .fetch({ dataService, force: true })
        .then(() => {
          return coll?.fetch({
            dataService,
            force: true,
            // We only need to fetch info in case of new collection being created
            fetchInfo: newCollection,
          });
        })
        .catch(() => {
          // We don't care if this fails
        });
    } catch (error) {
      log.warn(
        mongoLogId(1_001_000_320),
        'Instance Store',
        'Failed to refresh collection model',
        {
          message: (error as Error).message,
          connectionId: connectionId,
        }
      );
    }
  };

  on(connections, 'disconnected', function (connectionInfoId: string) {
    try {
      const instance =
        instancesManager.getMongoDBInstanceForConnection(connectionInfoId);
      instance.removeAllListeners();
    } catch (error) {
      log.warn(
        mongoLogId(1_001_000_322),
        'Instance Store',
        'Failed to remove instance listeners upon disconnect',
        {
          message: (error as Error).message,
          connectionId: connectionInfoId,
        }
      );
    }
    instancesManager.removeMongoDBInstanceForConnection(connectionInfoId);
  });

  on(connections, 'connected', function (instanceConnectionId: string) {
    const dataService =
      connections.getDataServiceForConnection(instanceConnectionId);
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

    void refreshInstance(
      {
        fetchDatabases: true,
        fetchDbStats: true,
      },
      {
        connectionId: instanceConnectionId,
      }
    );

    on(
      dataService,
      'topologyDescriptionChanged',
      ({
        newDescription,
      }: {
        newDescription: ReturnType<DataService['getLastSeenTopology']>;
      }) => {
        instance.set({
          topologyDescription: getTopologyDescription(newDescription),
        });
      }
    );
  });

  on(
    globalAppRegistry,
    'sidebar-expand-database',
    (databaseId: string, { connectionId }: { connectionId?: string } = {}) => {
      try {
        if (!connectionId) {
          throw new Error('connectionId is not provided');
        }
        const instance =
          instancesManager.getMongoDBInstanceForConnection(connectionId);
        const dataService =
          connections.getDataServiceForConnection(connectionId);
        void instance.databases
          .get(databaseId)
          ?.fetchCollections({ dataService });
      } catch (error) {
        log.warn(
          mongoLogId(1_001_000_323),
          'Instance Store',
          'Failed to respond to sidebar-expand-database',
          {
            message: (error as Error).message,
            connectionId: connectionId,
          }
        );
      }
    }
  );

  on(
    globalAppRegistry,
    'sidebar-filter-navigation-list',
    ({ connectionId }: { connectionId?: string } = {}) => {
      const connectedConnectionIds = Array.from(
        instancesManager.listMongoDBInstances().keys()
      );
      // connectionId will be provided by the sidebar when in single connection
      // mode. We don't derive that from the list of connected connections
      // because there is a possibility for us to be fetching all collections on
      // wrong connection that way
      const connectionIds = connectionId
        ? [connectionId]
        : connectedConnectionIds;
      for (const id of connectionIds) {
        void fetchAllCollections({ connectionId: id });
      }
    }
  );

  on(
    globalAppRegistry,
    'refresh-data',
    (
      refreshOptions?: Omit<
        Parameters<MongoDBInstance['refresh']>[0],
        'dataService'
      >
    ) => {
      for (const [connectionId] of instancesManager.listMongoDBInstances()) {
        void refreshInstance(refreshOptions, { connectionId });
      }
    }
  );

  on(
    globalAppRegistry,
    'database-dropped',
    (dbName: string, { connectionId }: { connectionId?: string } = {}) => {
      try {
        if (!connectionId) {
          throw new Error('No connectionId provided in event parameters');
        }
        const instance =
          instancesManager.getMongoDBInstanceForConnection(connectionId);

        const db = instance.databases.remove(dbName);
        if (db) {
          MongoDBInstance.removeAllListeners(db);
        }
      } catch (error) {
        log.warn(
          mongoLogId(1_001_000_325),
          'Instance Store',
          'Failed to respond to database-dropped',
          {
            message: (error as Error).message,
            connectionId: connectionId,
          }
        );
      }
    }
  );

  on(
    globalAppRegistry,
    'collection-dropped',
    (namespace: string, { connectionId }: { connectionId?: string } = {}) => {
      try {
        if (!connectionId) {
          throw new Error('No connectionId provided in event parameters');
        }

        const instance =
          instancesManager.getMongoDBInstanceForConnection(connectionId);
        const dataService =
          connections.getDataServiceForConnection(connectionId);
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
      } catch (error) {
        log.warn(
          mongoLogId(1_001_000_317),
          'Instance Store',
          'Failed to respond to collection-dropped',
          {
            message: (error as Error).message,
            connectionId: connectionId,
          }
        );
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
      try {
        if (!connectionId) {
          throw new Error('No connectionId provided in the event parameters');
        }
        const instance =
          instancesManager.getMongoDBInstanceForConnection(connectionId);

        const { database, collection } = toNS(from);
        instance.databases
          .get(database)
          ?.collections.get(collection, 'name')
          ?.set({ _id: to });
      } catch (err: any) {
        log.warn(
          mongoLogId(1_001_000_318),
          'Instance Store',
          'Failed to respond to collection-renamed',
          {
            message: (err as Error).message,
            connectionId: connectionId,
          }
        );
      }
    }
  );

  on(globalAppRegistry, 'document-deleted', refreshNamespaceStats);
  on(globalAppRegistry, 'document-inserted', refreshNamespaceStats);
  on(globalAppRegistry, 'import-finished', refreshNamespaceStats);

  on(
    globalAppRegistry,
    'collection-created',
    maybeAddAndRefreshCollectionModel
  );

  on(globalAppRegistry, 'view-created', maybeAddAndRefreshCollectionModel);

  on(
    globalAppRegistry,
    'agg-pipeline-out-executed',
    // null means the out / merge stage destination wasn't a namespace in the
    // same cluster
    (
      namespace: string | null,
      { connectionId }: { connectionId?: string } = {}
    ) => {
      if (!namespace) {
        return;
      }
      void maybeAddAndRefreshCollectionModel(namespace, { connectionId });
    }
  );

  on(
    globalAppRegistry,
    'view-edited',
    (namespace: string, { connectionId }: { connectionId?: string } = {}) => {
      try {
        if (!connectionId) {
          throw new Error('No connectionId provided in the event parameters');
        }
        const instance =
          instancesManager.getMongoDBInstanceForConnection(connectionId);
        const dataService =
          connections.getDataServiceForConnection(connectionId);
        const { database } = toNS(namespace);
        void instance.databases
          .get(database)
          ?.collections.get(namespace, '_id')
          ?.fetch({ dataService, force: true });
      } catch (error) {
        log.warn(
          mongoLogId(1_001_000_321),
          'Instance Store',
          'Failed to respond to view-edited',
          {
            message: (error as Error).message,
            connectionId: connectionId,
          }
        );
      }
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
