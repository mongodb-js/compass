import { createStore } from 'redux';
import { MongoDBInstance, serversArray, TopologyDescription } from 'mongodb-instance-model';
import toNS from 'mongodb-ns';
import reducer from '../modules/instance';
import { reset } from '../modules/instance/reset';
import { changeInstance } from '../modules/instance/instance';
import { changeErrorMessage } from '../modules/instance/error-message';
import { changeDataService } from '../modules/instance/data-service';

const debug = require('debug')('mongodb-compass:stores:InstanceStore');

function getTopologyDescription(topologyDescription) {
  return new TopologyDescription({
    type: topologyDescription.type,
    servers: serversArray(topologyDescription.servers),
    setName: topologyDescription.setName
  });
}

const store = createStore(reducer);

store.refreshInstance = async(globalAppRegistry, refreshOptions) => {
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
    globalAppRegistry.emit('instance-refreshed', {
      ...store.getState(),
      errorMessage: '',
    });
  } catch (err) {
    store.dispatch(changeErrorMessage(err.message));
    globalAppRegistry.emit('instance-refreshed', {
      ...store.getState(),
      errorMessage: err.message,
    });
  }
};

store.fetchDatabaseDetails = async(dbName, { nameOnly = false } = {}) => {
  const { instance, dataService } = store.getState();

  if (!instance || !dataService) {
    debug(
      'Trying to fetch database details without the model or dataService in the state'
    );
    return;
  }

  const db = instance.databases.get(dbName);

  if (nameOnly) {
    await db.fetchCollections({ dataService });
  } else {
    await db.fetchCollectionsDetails({ dataService });
  }
};

store.fetchCollectionDetails = async(ns) => {
  const { instance, dataService } = store.getState();

  if (!instance || !dataService) {
    debug(
      'Trying to fetch collection details without the model or dataService in the state'
    );
    return;
  }

  const { database } = toNS(ns);
  const coll = instance.databases.get(database).collections.get(ns);
  await coll.fetch({ dataService }).catch((err) => {
    // Ignoring this error means that we might open a tab without enough
    // collection metadata to correctly display it and even though maybe it's
    // not how we might want to handle this, this just preserves current
    // Compass behavior
    debug('failed to fetch collection details', err);
  });
  return coll;
};

store.fetchAllCollections = async() => {
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
};

/**
 * Fetches collection info and returns a special format of collection metadata
 * that events like open-in-new-tab, select-namespace, edit-view require
 */
store.fetchCollectionMetadata = async(ns) => {
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

  return await coll.fetchMetadata({ dataService });
};

store.refreshNamespace = async({ ns, database }) => {
  const { instance, dataService } = store.getState();
  if (!instance.databases.get(database)) {
    await instance.fetchDatabases({ dataService, force: true });
  }
  const db = instance.databases.get(database);
  if (!db.collections.get(ns)) {
    await db.fetchCollections({ dataService, force: true });
  }
  await store.refreshNamespaceStats(ns);
};

store.refreshNamespaceStats = async(ns) => {
  const { instance, dataService } = store.getState();
  const { database } = toNS(ns);
  const db = instance.databases.get(database);
  const coll = db.collections.get(ns);
  // We don't care if this fails
  await Promise.allSettled([
    db.fetch({ dataService, force: true }),
    coll.fetch({ dataService, force: true }),
  ]);
};

store.onActivated = (appRegistry) => {
  // Events emitted from the app registry:
  appRegistry.on('data-service-disconnected', () => {
    // eslint-disable-next-line chai-friendly/no-unused-expressions
    global.hadronApp.instance?.removeAllListeners();
    global.hadronApp.instance = null;
    appRegistry.emit('instance-destroyed', { instance: null });
    store.dispatch(reset());
  });

  appRegistry.on('data-service-connected', (err, dataService) => {
    if (err) {
      store.dispatch(changeErrorMessage(err.message));
      appRegistry.emit('instance-refreshed', {
        dataService: null,
        instance: null,
        errorMessage: err.message,
      });
      return;
    }

    const connectionString = dataService.getConnectionString();
    const firstHost = connectionString.hosts[0] || '';
    const [hostname, port] = firstHost.split(':');

    const instance = (global.hadronApp.instance = new MongoDBInstance({
      _id: firstHost,
      hostname: hostname,
      port: port ? +port : undefined,
      topologyDescription: getTopologyDescription(dataService.getLastSeenTopology())
    }));

    debug('instance-created');
    appRegistry.emit('instance-created', { instance });

    store.dispatch(changeDataService(dataService));
    store.dispatch(changeInstance(instance));

    store.refreshInstance(appRegistry, {
      fetchDatabases: true,
      fetchDbStats: true,
    });

    dataService.on('topologyDescriptionChanged', (evt) => {
      instance.set({
        topologyDescription: getTopologyDescription(evt.newDescription)
      });
    });

    /*
    debug('initial topologyDescription', {
      isTopologyWritable: instance.isTopologyWritable,
      singleServerType: instance.singleServerType,
      isServerWritable: instance.isServerWritable,
      isWritable: instance.isWritable,
      description: instance.description,
      env: instance.env
    });
    */
  });


  appRegistry.on('select-database', (dbName) => {
    store.fetchDatabaseDetails(dbName);
  });

  appRegistry.on('sidebar-expand-database', (dbName) => {
    store.fetchDatabaseDetails(dbName, { nameOnly: true });
  });

  appRegistry.on('sidebar-filter-navigation-list', () => {
    store.fetchAllCollections();
  });

  appRegistry.on('select-namespace', ({ namespace }) => {
    store.fetchCollectionDetails(namespace);
  });

  appRegistry.on('open-namespace-in-new-tab', ({ namespace }) => {
    store.fetchCollectionDetails(namespace);
  });

  appRegistry.on('refresh-data', () => {
    store.refreshInstance(appRegistry);
  });

  appRegistry.on('agg-pipeline-out-executed', () => {
    store.refreshInstance(appRegistry);
  });

  appRegistry.on('document-deleted', ({ ns }) => {
    store.refreshNamespaceStats(ns);
  });

  appRegistry.on('document-inserted', ({ ns }) => {
    store.refreshNamespaceStats(ns);
  });

  appRegistry.on('import-finished', ({ ns }) => {
    store.refreshNamespaceStats(ns);
  });

  appRegistry.on('collection-created', (ns) => {
    store.refreshNamespace(ns);
  });

  appRegistry.on('collections-list-select-collection', async({ ns }) => {
    const metadata = await store.fetchCollectionMetadata(ns);
    appRegistry.emit('select-namespace', metadata);
  });

  appRegistry.on('sidebar-select-collection', async({ ns }) => {
    const metadata = await store.fetchCollectionMetadata(ns);
    appRegistry.emit('select-namespace', metadata);
  });

  appRegistry.on('sidebar-open-collection-in-new-tab', async({ ns }) => {
    const metadata = await store.fetchCollectionMetadata(ns);
    appRegistry.emit('open-namespace-in-new-tab', metadata);
  });

  appRegistry.on('sidebar-modify-view', async({ ns }) => {
    const coll = await store.fetchCollectionDetails(ns);
    if (coll.sourceId && coll.pipeline) {
      // `modify-view` is currently implemented in a way where we are basically
      // just opening a new tab but for a source collection instead of a view
      // and with source pipeline of this new tab set to the view pipeline
      // instead of the actual source pipeline of the view source. This
      // definitely feels like putting too much logic on the same property, but
      // refactoring this away would require us to change way too many things in
      // the collection / aggregation plugins, so we're just keeping it as it is
      const metadata = await store.fetchCollectionMetadata(coll.sourceId);
      metadata.sourcePipeline = coll.pipeline;
      metadata.editViewName = coll.ns;
      appRegistry.emit('open-namespace-in-new-tab', metadata);
    } else {
      debug(
        'Tried to modify the view on a collection with required metadata missing',
        coll.toJSON()
      );
    }
  });

  appRegistry.on('sidebar-duplicate-view', async({ ns }) => {
    const coll = await store.fetchCollectionDetails(ns);
    if (coll.sourceId && coll.pipeline) {
      appRegistry.emit('open-create-view', {
        source: coll.sourceId,
        pipeline: coll.pipeline,
        duplicate: true,
      });
    } else {
      debug(
        'Tried to duplicate the view for a collection with required metadata missing',
        coll.toJSON()
      );
    }
  });

  appRegistry.on(
    'aggregations-open-result-namespace',
    async function(namespace) {
      // Force-refresh specified namespace to update collections list and get
      // collection info / stats (in case of opening result collection we're

      // always assuming the namespace wasn't yet updated)
      await store.refreshNamespace(toNS(namespace));
      // Now we can get the metadata from already fetched collection and open a
      // tab for it
      const metadata = await store.fetchCollectionMetadata(namespace);
      appRegistry.emit('open-namespace-in-new-tab', metadata);
    }
  );
};

store.subscribe(() => {
  const state = store.getState();
  debug('App.InstanceStore changed to', state);
});

export default store;
