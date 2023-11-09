import { createStore } from 'redux';
import type { MongoDBInstanceProps } from 'mongodb-instance-model';
import {
  MongoDBInstance,
  // @ts-expect-error mongodb-instance-model needs better typing
  serversArray,
  // @ts-expect-error mongodb-instance-model needs better typing
  TopologyDescription,
} from 'mongodb-instance-model';
import toNS from 'mongodb-ns';
import reducer from '../modules/instance';
import { reset } from '../modules/instance/reset';
import { changeInstance } from '../modules/instance/instance';
import { changeErrorMessage } from '../modules/instance/error-message';
import { changeDataService } from '../modules/instance/data-service';
import type { DataService } from 'mongodb-data-service';
import type { AppRegistry } from 'hadron-app-registry';
import type { LoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';

function getTopologyDescription(
  topologyDescription: ReturnType<DataService['getLastSeenTopology']>
) {
  if (!topologyDescription) return undefined;
  return new TopologyDescription({
    type: topologyDescription.type,
    servers: serversArray(topologyDescription.servers),
    setName: topologyDescription.setName,
  });
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
  const store = createStore(reducer);
  const cleanup: (() => void)[] = [];

  function getInstance() {
    return store.getState().instance!;
  }

  async function refreshInstance(
    refreshOptions: Omit<
      Parameters<MongoDBInstance['refresh']>[0],
      'dataService'
    > = {}
  ) {
    const { instance, dataService } = store.getState();

    if (!instance || !dataService) {
      debug(
        'Trying to refresh the MongoDB instance model without the model or dataService in the state'
      );
      return;
    }

    try {
      await instance.refresh({ dataService, ...refreshOptions });

      store.dispatch(changeErrorMessage(''));
      appRegistry.emit('instance-refreshed', {
        ...store.getState(),
        errorMessage: '',
      });
    } catch (err: any) {
      store.dispatch(changeErrorMessage(err.message));
      appRegistry.emit('instance-refreshed', {
        ...store.getState(),
        errorMessage: err.message,
      });
    }
  }

  async function fetchDatabaseDetails(
    dbName: string,
    { nameOnly = false } = {}
  ) {
    const { instance, dataService } = store.getState();

    if (!instance || !dataService) {
      debug(
        'Trying to fetch database details without the model or dataService in the state'
      );
      return;
    }

    const db = instance.databases.get(dbName);

    if (nameOnly) {
      await db?.fetchCollections({ dataService });
    } else {
      await db?.fetchCollectionsDetails({ dataService });
    }
  }

  async function fetchCollectionDetails(ns: string) {
    const { instance, dataService } = store.getState();

    if (!instance || !dataService) {
      debug(
        'Trying to fetch collection details without the model or dataService in the state'
      );
      return;
    }

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
    const { instance, dataService } = store.getState();

    if (!instance || !dataService) {
      debug(
        'Trying to fetch collections without the model or dataService in the state'
      );
      return;
    }

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
    const { instance, dataService } = store.getState();
    const { database, collection } = toNS(ns);

    if (!instance || !dataService) {
      debug(
        'Trying to fetch collection metadata without the model or dataService in the state'
      );
      return;
    }

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
    const instance = getInstance();
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
    const instance = getInstance();
    const { database } = toNS(ns);
    const db = instance.databases.get(database);
    const coll = db?.collections.get(ns);
    // We don't care if this fails
    await Promise.allSettled([
      db?.fetch({ dataService, force: true }),
      coll?.fetch({ dataService, force: true }),
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
  const instance = new MongoDBInstance(
    initialInstanceProps as MongoDBInstanceProps
  );
  if ((globalThis as any).hadronApp) {
    (globalThis as any).hadronApp.instance = instance;
  }

  debug('instance-created');
  appRegistry.emit('instance-created', { instance });

  store.dispatch(changeDataService(dataService));
  store.dispatch(changeInstance(instance));

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
    const hadronApp = (globalThis as any).hadronApp;
    if (hadronApp?.instance === instance) {
      hadronApp.instance?.removeAllListeners();
      hadronApp.instance = null;
    }
    appRegistry.emit('instance-destroyed', { instance: null });
    store.dispatch(reset());
  });

  const onSelectDatabase = voidify(fetchDatabaseDetails);
  appRegistry.on('select-database', onSelectDatabase);
  cleanup.push(() =>
    appRegistry.removeListener('select-database', onSelectDatabase)
  );

  const onSidebarExpandDatabase = (dbName: string) =>
    void fetchDatabaseDetails(dbName, { nameOnly: true });
  appRegistry.on('sidebar-expand-database', onSidebarExpandDatabase);
  cleanup.push(() =>
    appRegistry.removeListener(
      'sidebar-expand-database',
      onSidebarExpandDatabase
    )
  );

  const onSidebarFilterNavigationList = voidify(fetchAllCollections);
  appRegistry.on(
    'sidebar-filter-navigation-list',
    onSidebarFilterNavigationList
  );
  cleanup.push(() =>
    appRegistry.removeListener(
      'sidebar-filter-navigation-list',
      onSidebarFilterNavigationList
    )
  );

  const onSelectNamespace = ({ namespace }: { namespace: string }) =>
    void fetchCollectionDetails(namespace);
  appRegistry.on('select-namespace', onSelectNamespace);
  cleanup.push(() =>
    appRegistry.removeListener('select-namespace', onSelectNamespace)
  );

  const onOpenNamespaceInNewTab = ({ namespace }: { namespace: string }) =>
    void fetchCollectionDetails(namespace);
  appRegistry.on('open-namespace-in-new-tab', onOpenNamespaceInNewTab);
  cleanup.push(() =>
    appRegistry.removeListener(
      'open-namespace-in-new-tab',
      onOpenNamespaceInNewTab
    )
  );

  const onRefreshData = voidify(refreshInstance);
  appRegistry.on('refresh-data', onRefreshData);
  cleanup.push(() => appRegistry.removeListener('refresh-data', onRefreshData));

  const onDatabaseDropped = () =>
    void getInstance().fetchDatabases({ dataService, force: true });
  appRegistry.on('database-dropped', onDatabaseDropped);
  cleanup.push(() =>
    appRegistry.removeListener('database-dropped', onDatabaseDropped)
  );

  const onCollectionDropped = voidify(async (namespace: string) => {
    const instance = getInstance();
    const { database } = toNS(namespace);
    await instance.fetchDatabases({ dataService, force: true });
    const db = instance.databases.get(database);
    // If it was last collection, there will be no db returned
    await db?.fetchCollections({ dataService, force: true });
  });
  appRegistry.on('collection-dropped', onCollectionDropped);
  cleanup.push(() =>
    appRegistry.removeListener('collection-dropped', onCollectionDropped)
  );

  // Event emitted when the Databases grid needs to be refreshed
  // We additionally refresh the list of collections as well
  // since there is the side navigation which could be in expanded mode
  const onRefreshDatabases = voidify(async () => {
    const instance = getInstance();
    await instance.fetchDatabases({ dataService, force: true });
    await Promise.allSettled(
      instance.databases.map((db) =>
        db.fetchCollections({ dataService, force: true })
      )
    );
  });
  appRegistry.on('refresh-databases', onRefreshDatabases);
  cleanup.push(() =>
    appRegistry.removeListener('refresh-databases', onRefreshDatabases)
  );

  // Event emitted when the Collections grid needs to be refreshed
  // with new collections or collection stats for existing ones.
  const onRefreshCollections = voidify(async ({ ns }: { ns: string }) => {
    const instance = getInstance();
    const { database } = toNS(ns);
    if (!instance.databases.get(database)) {
      await instance.fetchDatabases({ dataService, force: true });
    }
    const db = instance.databases.get(database);
    if (db) {
      await db.fetchCollectionsDetails({ dataService, force: true });
    }
  });
  appRegistry.on('refresh-collections', onRefreshCollections);
  cleanup.push(() =>
    appRegistry.removeListener('refresh-collections', onRefreshCollections)
  );

  const onAggPipelineOutExecuted = voidify(refreshInstance);
  appRegistry.on('agg-pipeline-out-executed', onAggPipelineOutExecuted);
  cleanup.push(() =>
    appRegistry.removeListener(
      'agg-pipeline-out-executed',
      onAggPipelineOutExecuted
    )
  );

  const onRefreshNamespaceStats = ({ ns }: { ns: string }) => {
    void refreshNamespaceStats(ns);
  };
  appRegistry.on('document-deleted', onRefreshNamespaceStats);
  cleanup.push(() =>
    appRegistry.removeListener('document-deleted', onRefreshNamespaceStats)
  );
  appRegistry.on('document-inserted', onRefreshNamespaceStats);
  cleanup.push(() =>
    appRegistry.removeListener('document-inserted', onRefreshNamespaceStats)
  );
  appRegistry.on('import-finished', onRefreshNamespaceStats);
  cleanup.push(() =>
    appRegistry.removeListener('import-finished', onRefreshNamespaceStats)
  );

  const onCollectionCreated = voidify(async ({ ns, database }) => {
    await refreshNamespace({ ns, database });
    const metadata = await fetchCollectionMetadata(ns);
    appRegistry.emit('select-namespace', metadata);
  });
  appRegistry.on('collection-created', onCollectionCreated);
  cleanup.push(() =>
    appRegistry.removeListener('collection-created', onCollectionCreated)
  );

  const onActiveCollectionDropped = (ns: string) => {
    // This callback will fire after drop collection happened, we force it into
    // a microtask to allow drop collections event handler to force start
    // databases and collections list update before we run our check here
    queueMicrotask(
      voidify(async () => {
        const instance = getInstance();
        const { database } = toNS(ns);
        await instance.fetchDatabases({ dataService });
        const db = instance.databases.get(database);
        await db?.fetchCollections({ dataService });
        if (db?.collectionsLength) {
          appRegistry.emit('select-database', database);
        } else {
          appRegistry.emit('open-instance-workspace', 'Databases');
        }
      })
    );
  };
  appRegistry.on('active-collection-dropped', onActiveCollectionDropped);
  cleanup.push(() =>
    appRegistry.removeListener(
      'active-collection-dropped',
      onActiveCollectionDropped
    )
  );

  const onActiveDatabaseDropped = () => {
    appRegistry.emit('open-instance-workspace', 'Databases');
  };
  appRegistry.on('active-database-dropped', onActiveDatabaseDropped);
  cleanup.push(() =>
    appRegistry.removeListener(
      'active-database-dropped',
      onActiveDatabaseDropped
    )
  );

  /**
   * Opens collection in the current active tab. No-op if currently open tab has
   * the same namespace. Additional `query` and `agrregation` props can be
   * passed with the namespace to open tab with initial query or aggregation
   * pipeline
   */
  const openCollectionInSameTab = voidify(
    async ({
      ns,
      ...extraMetadata
    }: Record<string, unknown> & { ns: string }) => {
      const metadata = await fetchCollectionMetadata(ns);
      appRegistry.emit('select-namespace', {
        ...metadata,
        ...extraMetadata,
      });
    }
  );

  appRegistry.on('collections-list-select-collection', openCollectionInSameTab);
  cleanup.push(() =>
    appRegistry.removeListener(
      'collections-list-select-collection',
      openCollectionInSameTab
    )
  );
  appRegistry.on('sidebar-select-collection', openCollectionInSameTab);
  cleanup.push(() =>
    appRegistry.removeListener(
      'sidebar-select-collection',
      openCollectionInSameTab
    )
  );
  appRegistry.on(
    'collection-workspace-select-namespace',
    openCollectionInSameTab
  );
  cleanup.push(() =>
    appRegistry.removeListener(
      'collection-workspace-select-namespace',
      openCollectionInSameTab
    )
  );
  appRegistry.on('collection-tab-select-collection', openCollectionInSameTab);
  cleanup.push(() =>
    appRegistry.removeListener(
      'collection-tab-select-collection',
      openCollectionInSameTab
    )
  );

  /**
   * Opens collection in a new tab. Additional `query` and `agrregation` props
   * can be passed with the namespace to open tab with initial query or
   * aggregation pipeline
   */
  const openCollectionInNewTab = voidify(
    async (
      { ns, ...extraMetadata }: Record<string, unknown> & { ns: string },
      forceRefreshNamespace = false
    ) => {
      if (forceRefreshNamespace) {
        await refreshNamespace(toNS(ns));
      }
      const metadata = await fetchCollectionMetadata(ns);
      appRegistry.emit('open-namespace-in-new-tab', {
        ...metadata,
        ...extraMetadata,
      });
    }
  );

  appRegistry.on('sidebar-open-collection-in-new-tab', openCollectionInNewTab);
  cleanup.push(() =>
    appRegistry.removeListener(
      'sidebar-open-collection-in-new-tab',
      openCollectionInNewTab
    )
  );
  appRegistry.on(
    'import-export-open-collection-in-new-tab',
    openCollectionInNewTab
  );
  cleanup.push(() =>
    appRegistry.removeListener(
      'import-export-open-collection-in-new-tab',
      openCollectionInNewTab
    )
  );
  appRegistry.on(
    'collection-workspace-open-collection-in-new-tab',
    openCollectionInNewTab
  );
  cleanup.push(() =>
    appRegistry.removeListener(
      'collection-workspace-open-collection-in-new-tab',
      openCollectionInNewTab
    )
  );
  appRegistry.on('my-queries-open-saved-item', openCollectionInNewTab);
  cleanup.push(() =>
    appRegistry.removeListener(
      'my-queries-open-saved-item',
      openCollectionInNewTab
    )
  );
  appRegistry.on('search-indexes-run-aggregate', openCollectionInNewTab);
  cleanup.push(() =>
    appRegistry.removeListener(
      'search-indexes-run-aggregate',
      openCollectionInNewTab
    )
  );

  // In case of opening result collection we're always assuming the namespace
  // wasn't yet updated, so opening a new tab always with refresh
  const onOpenResultNamespace = (ns: string) => {
    openCollectionInNewTab({ ns }, true);
  };
  appRegistry.on('aggregations-open-result-namespace', onOpenResultNamespace);
  cleanup.push(() =>
    appRegistry.removeListener(
      'aggregations-open-result-namespace',
      onOpenResultNamespace
    )
  );
  appRegistry.on('create-view-open-result-namespace', onOpenResultNamespace);
  cleanup.push(() =>
    appRegistry.removeListener(
      'create-view-open-result-namespace',
      onOpenResultNamespace
    )
  );

  const openModifyView = voidify(
    async ({ ns, sameTab }: { ns: string; sameTab: boolean }) => {
      const coll = await fetchCollectionDetails(ns);
      if (coll?.sourceId && coll?.pipeline) {
        // `modify-view` is currently implemented in a way where we are basically
        // just opening a new tab but for a source collection instead of a view
        // and with source pipeline of this new tab set to the view pipeline
        // instead of the actual source pipeline of the view source. This
        // definitely feels like putting too much logic on the same property, but
        // refactoring this away would require us to change way too many things in
        // the collection / aggregation plugins, so we're just keeping it as it is
        const metadata: Record<string, unknown> =
          (await fetchCollectionMetadata(coll.sourceId)) ?? {};
        metadata.sourcePipeline = coll.pipeline;
        metadata.editViewName = coll.ns;
        appRegistry.emit(
          sameTab ? 'select-namespace' : 'open-namespace-in-new-tab',
          metadata
        );
      } else {
        debug(
          'Tried to modify the view on a collection with required metadata missing',
          coll?.toJSON()
        );
      }
    }
  );

  appRegistry.on('sidebar-modify-view', openModifyView);
  cleanup.push(() =>
    appRegistry.removeListener('sidebar-modify-view', openModifyView)
  );
  const onCollectionTabModifyView = ({ ns }: { ns: string }) => {
    openModifyView({ ns, sameTab: true });
  };
  appRegistry.on('collection-tab-modify-view', onCollectionTabModifyView);
  cleanup.push(() =>
    appRegistry.removeListener(
      'collection-tab-modify-view',
      onCollectionTabModifyView
    )
  );

  const onSidebarDuplicateView = voidify(async ({ ns }) => {
    const coll = await fetchCollectionDetails(ns);
    if (coll?.sourceId && coll?.pipeline) {
      appRegistry.emit('open-create-view', {
        source: coll.sourceId,
        pipeline: coll.pipeline,
        duplicate: true,
      });
    } else {
      debug(
        'Tried to duplicate the view for a collection with required metadata missing',
        coll?.toJSON()
      );
    }
  });
  appRegistry.on('sidebar-duplicate-view', onSidebarDuplicateView);
  cleanup.push(() =>
    appRegistry.removeListener('sidebar-duplicate-view', onSidebarDuplicateView)
  );

  const onAggregationsOpenViewAfterUpdate = voidify(async function (ns) {
    const metadata = await fetchCollectionMetadata(ns);
    appRegistry.emit('select-namespace', metadata);
  });
  appRegistry.on(
    'aggregations-open-view-after-update',
    onAggregationsOpenViewAfterUpdate
  );
  cleanup.push(() =>
    appRegistry.removeListener(
      'aggregations-open-view-after-update',
      onAggregationsOpenViewAfterUpdate
    )
  );

  store.subscribe(() => {
    const state = store.getState();
    debug('App.InstanceStore changed to', state);
  });

  return Object.assign(store, {
    getInstance,
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
  });
}
