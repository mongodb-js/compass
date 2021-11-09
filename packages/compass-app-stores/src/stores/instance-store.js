import { createStore } from 'redux';
import MongoDbInstance from 'mongodb-instance-model';
import toNS from 'mongodb-ns';
import reducer from '../modules/instance';
import { reset } from '../modules/instance/reset';
import { changeInstance } from '../modules/instance/instance';
import { changeErrorMessage } from '../modules/instance/error-message';
import { changeDataService } from '../modules/instance/data-service';

const debug = require('debug')('mongodb-compass:stores:InstanceStore');

const store = createStore(reducer);

store.refreshInstance = async(globalAppRegistry, refreshOptions) => {
  const { instance, dataService } = store.getState();

  if (!instance || !dataService) {
    debug(
      'Trying to refresh the MongoDB instance model without the model or dataService in the state'
    );
    return;
  }

  if (process.env.COMPASS_NO_GLOBAL_OVERLAY !== 'true') {
    // eslint-disable-next-line chai-friendly/no-unused-expressions
    globalAppRegistry
      .getAction('Status.Actions')
      ?.showIndeterminateProgressBar();
    // eslint-disable-next-line chai-friendly/no-unused-expressions
    globalAppRegistry.getAction('Status.Actions')?.configure({
      animation: true,
      message: 'Loading databases',
      visible: true,
    });
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
  } finally {
    if (process.env.COMPASS_NO_GLOBAL_OVERLAY !== 'true') {
      // eslint-disable-next-line chai-friendly/no-unused-expressions
      globalAppRegistry.getAction('Status.Actions')?.hide();
    }
  }
};

store.fetchDatabaseDetails = async(dbName, { nameOnly = false } = {}) => {
  const { instance, dataService } = store.getState();
  const db = instance.databases.get(dbName);

  if (db && db.collectionsStatus === 'initial') {
    await db.fetchCollections({ dataService, fetchInfo: !nameOnly });
  }

  if (nameOnly) {
    return;
  }

  await Promise.all(
    db.collections.map((coll) => {
      if (coll.status === 'initial') {
        return coll.fetch({ dataService, fetchInfo: false }).catch(() => {
          /* we don't care if this fails, it just means less stats in the UI */
        });
      }
    })
  );
};

store.fetchCollectionDetails = async(ns) => {
  const { instance, dataService } = store.getState();
  const { database } = toNS(ns);
  const db = instance.databases.get(database);
  const coll = db.collections.get(ns);
  if (coll.status === 'initial') {
    await coll.fetch({ dataService }).catch(() => {
      /* we don't care if this fails */
    });
  }
};

store.refreshNamespaceStats = async(ns) => {
  const { instance, dataService } = store.getState();
  const { database } = toNS(ns);
  const db = instance.databases.get(database);
  const coll = db.collections.get(ns);
  await Promise.all([
    db.fetch({ dataService }).catch(() => {
      /* we don't care if this fails */
    }),
    coll.fetch({ dataService }).catch(() => {
      /* we don't care if this fails */
    }),
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

    const instance = (global.hadronApp.instance = new MongoDbInstance({
      _id: firstHost,
      hostname: hostname,
      port: port ? +port : undefined,
    }));

    appRegistry.emit('instance-created', { instance });

    store.dispatch(changeDataService(dataService));
    store.dispatch(changeInstance(instance));

    // Preserving the "greedy" fetch of db and collection stats if global
    // overlay will be shown
    const fetchCollectionsInfo = process.env.COMPASS_NO_GLOBAL_OVERLAY !== 'true';

    store.refreshInstance(appRegistry, {
      fetchDatabases: true,
      fetchDbStats: true,
      fetchCollections: fetchCollectionsInfo,
      fetchCollInfo: fetchCollectionsInfo,
    });
  });

  appRegistry.on('select-database', (dbName) => {
    store.fetchDatabaseDetails(dbName);
  });

  appRegistry.on('expand-database', (dbName) => {
    store.fetchDatabaseDetails(dbName, { nameOnly: true });
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
};

store.subscribe(() => {
  const state = store.getState();
  debug('App.InstanceStore changed to', state);
});

export default store;
