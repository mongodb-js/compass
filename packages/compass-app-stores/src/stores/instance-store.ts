import type { MongoDBInstanceProps } from 'mongodb-instance-model';
import { MongoDBInstance } from 'mongodb-instance-model';
import toNS from 'mongodb-ns';
import type { DataService } from 'mongodb-data-service';
import type { AppRegistry } from 'hadron-app-registry';
import type { LoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';
import { openToast } from '@mongodb-js/compass-components';

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

function voidify<T extends (...args: any[]) => Promise<void>>(
  fn: T
): (...args: Parameters<T>) => void {
  return (...args) => void fn(...args);
}

export function createInstanceStore({
  globalAppRegistry: appRegistry,
  dataService,
  logger: { debug },
}: {
  dataService: DataService;
  logger: LoggerAndTelemetry;
  globalAppRegistry: AppRegistry;
}) {
  const cleanup: (() => void)[] = [];

  async function refreshInstance(
    refreshOptions: Omit<
      Parameters<MongoDBInstance['refresh']>[0],
      'dataService'
    > = {}
  ) {
    const isFirstRun = instance.status === 'initial';

    try {
      await instance.refresh({ dataService, ...refreshOptions });

      appRegistry.emit('instance-refreshed', {
        instance,
        dataService,
        errorMessage: '',
      });
    } catch (err: any) {
      appRegistry.emit('instance-refreshed', {
        instance,
        dataService,
        errorMessage: err.message,
      });

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

  async function fetchDatabaseDetails(
    dbName: string,
    { nameOnly = false } = {}
  ) {
    const db = instance.databases.get(dbName);

    if (nameOnly) {
      await db?.fetchCollections({ dataService });
    } else {
      await db?.fetchCollectionsDetails({ dataService });
    }
  }

  async function fetchCollectionDetails(ns: string) {
    const { database } = toNS(ns);
    const coll = instance.databases.get(database)?.collections.get(ns);
    await coll?.fetch({ dataService }).catch((err) => {
      // Ignoring this error means that we might open a tab without enough
      // collection metadata to correctly display it and even though maybe it's
      // not how we might want to handle this, this just preserves current
      // Compass behavior
      debug('failed to fetch collection details', err);
    });
    return coll;
  }

  async function fetchAllCollections() {
    // It is possible to get here before the databases finished loading. We have
    // to wait for the databases, otherwise it will load all the collections for 0
    // databases.
    await instance.fetchDatabases({ dataService });

    await Promise.all(
      instance.databases.map((db) => {
        return db.fetchCollections({ dataService });
      })
    );
  }

  /**
   * Fetches collection info and returns a special format of collection metadata
   * that events like open-in-new-tab, select-namespace, edit-view require
   */
  async function fetchCollectionMetadata(ns: string) {
    const { database, collection } = toNS(ns);

    const coll = await instance.getNamespace({
      database,
      collection,
      dataService,
    });

    return await coll?.fetchMetadata({ dataService });
  }

  async function refreshNamespace({
    ns,
    database,
  }: {
    ns: string;
    database: string;
  }) {
    if (!instance.databases.get(database)) {
      await instance.fetchDatabases({ dataService, force: true });
    }
    const db = instance.databases.get(database);
    if (!db?.collections.get(ns)) {
      await db?.fetchCollections({ dataService, force: true });
    }
    await refreshNamespaceStats(ns);
  }

  async function refreshNamespaceStats(ns: string) {
    const { database } = toNS(ns);
    const db = instance.databases.get(database);
    const coll = db?.collections.get(ns);
    // We don't care if this fails
    await Promise.allSettled([
      db?.fetch({ dataService, force: true }),
      coll?.fetch({ dataService, force: true }),
    ]);
  }

  // A shared method that will try to add new namespace model to the instance
  // model
  async function addAndRefreshCollectionModel(namespace: string) {
    const { database } = toNS(namespace);
    const db =
      instance.databases.get(database) ??
      // We might be adding collection to a new db namespace
      instance.databases.add({ _id: database });
    // We might be refreshing an existing namespace (in case of out stage usage
    // for example)
    if (!db.collections.get(namespace, '_id')) {
      db.collections.add({ _id: namespace });
    }
    // Update database stats and collection list
    await Promise.allSettled([
      db.fetch({ dataService, force: true }),
      db.fetchCollections({ dataService, force: true }),
    ]);
    // When those are ready, update new collection stats
    await db.collections
      .get(namespace, '_id')
      ?.fetch({ dataService, force: true });
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
  const instance = new MongoDBInstance(
    initialInstanceProps as MongoDBInstanceProps
  );
  if ((globalThis as any).hadronApp) {
    // TODO(COMPASS-7442): Remove this
    (globalThis as any).hadronApp.instance = instance;
  }

  debug('instance-created');
  appRegistry.emit('instance-created', { instance });

  void refreshInstance({
    fetchDatabases: true,
    fetchDbStats: true,
  });

  function onTopologyDescriptionChanged({
    newDescription,
  }: {
    newDescription: ReturnType<DataService['getLastSeenTopology']>;
  }) {
    (instance as any).set({
      topologyDescription: getTopologyDescription(newDescription),
    });
  }

  dataService.on('topologyDescriptionChanged', onTopologyDescriptionChanged);
  cleanup.push(() =>
    dataService.off?.(
      'topologyDescriptionChanged',
      onTopologyDescriptionChanged
    )
  );

  cleanup.push(() => {
    instance.removeAllListeners();
    const hadronApp = (globalThis as any).hadronApp;
    if (hadronApp?.instance === instance) {
      hadronApp.instance = null;
    }
    appRegistry.emit('instance-destroyed', { instance: null });
  });

  function onAppRegistryEvent(ev: string, listener: (...args: any[]) => void) {
    appRegistry.on(ev, listener);
    cleanup.push(() => appRegistry.removeListener(ev, listener));
  }

  const onSidebarExpandDatabase = (dbName: string) =>
    void fetchDatabaseDetails(dbName, { nameOnly: true });
  onAppRegistryEvent('sidebar-expand-database', onSidebarExpandDatabase);

  const onSidebarFilterNavigationList = voidify(fetchAllCollections);
  onAppRegistryEvent(
    'sidebar-filter-navigation-list',
    onSidebarFilterNavigationList
  );

  const onRefreshData = voidify(refreshInstance);
  onAppRegistryEvent('refresh-data', onRefreshData);

  const onDatabaseDropped = () =>
    void instance.fetchDatabases({ dataService, force: true });
  onAppRegistryEvent('database-dropped', onDatabaseDropped);

  const onCollectionDropped = voidify(async (namespace: string) => {
    const { database } = toNS(namespace);
    await instance.fetchDatabases({ dataService, force: true });
    const db = instance.databases.get(database);
    // If it was last collection, there will be no db returned
    await db?.fetchCollections({ dataService, force: true });
  });
  onAppRegistryEvent('collection-dropped', onCollectionDropped);

  // Event emitted when the Databases grid needs to be refreshed
  // We additionally refresh the list of collections as well
  // since there is the side navigation which could be in expanded mode
  const onRefreshDatabases = voidify(async () => {
    await instance.fetchDatabases({ dataService, force: true });
    await Promise.allSettled(
      instance.databases.map((db) =>
        db.fetchCollections({ dataService, force: true })
      )
    );
  });
  onAppRegistryEvent('refresh-databases', onRefreshDatabases);

  onAppRegistryEvent(
    'collection-renamed',
    ({ from, to }: { from: string; to: string }) => {
      const { database, collection } = toNS(from);
      instance.databases
        .get(database)
        ?.collections.get(collection, 'name')
        ?.set({ _id: to });
    }
  );

  const onRefreshNamespaceStats = ({ ns }: { ns: string }) => {
    void refreshNamespaceStats(ns);
  };
  onAppRegistryEvent('document-deleted', onRefreshNamespaceStats);
  onAppRegistryEvent('document-inserted', onRefreshNamespaceStats);
  onAppRegistryEvent('import-finished', onRefreshNamespaceStats);

  onAppRegistryEvent('collection-created', (namespace: string) => {
    void addAndRefreshCollectionModel(namespace);
  });

  onAppRegistryEvent('view-created', (namespace: string) => {
    void addAndRefreshCollectionModel(namespace);
  });

  onAppRegistryEvent(
    'agg-pipeline-out-executed',
    // null means the out / merge stage destination wasn't a namespace in the
    // same cluster
    (namespace: string | null) => {
      if (!namespace) {
        return;
      }
      void addAndRefreshCollectionModel(namespace);
    }
  );

  onAppRegistryEvent('view-edited', (namespace: string) => {
    void refreshNamespace(toNS(namespace));
  });

  return {
    state: { instance }, // Using LegacyRefluxProvider here to pass state to provider
    getState() {
      return { instance };
    }, // Legacy, for getStore('App.InstanceStore').getState() compat
    refreshInstance,
    fetchDatabaseDetails,
    fetchCollectionDetails,
    fetchAllCollections,
    fetchCollectionMetadata,
    refreshNamespace,
    refreshNamespaceStats,
    deactivate() {
      for (const cleaner of cleanup) cleaner();
    },
  };
}
