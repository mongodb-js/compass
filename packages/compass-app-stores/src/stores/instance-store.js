import { createStore } from 'redux';
import MongoDbInstance from 'mongodb-instance-model';
import reducer from '../modules/instance';
import { reset } from '../modules/instance/reset';
import { changeInstance } from '../modules/instance/instance';
import { changeErrorMessage } from '../modules/instance/error-message';
import { changeDataService } from '../modules/instance/data-service';

const debug = require('debug')('mongodb-compass:stores:InstanceStore');

const store = createStore(reducer);

store.refreshInstance = async(globalAppRegistry) => {
  const { instance, dataService } = store.getState();
  if (!instance) {
    debug(
      'Trying to refresh the MongoDB instance model without the model in the state'
    );
    return;
  }

  // eslint-disable-next-line chai-friendly/no-unused-expressions
  globalAppRegistry.getAction('Status.Actions')?.configure({
    animation: true,
    message: 'Loading databases',
    visible: true,
  });

  try {
    await instance.fetch({ dataService });
    await instance.databases.fetch({ dataService });
    await Promise.all(
      instance.databases
        .map((db) => {
          return [
            db.fetch({ dataService }).catch(() => {
              /* we don't care if this fails, it just means less dbStats in the UI */
            }),
            db.collections.fetch({ dataService }),
          ];
        })
        .flat()
    );

    // eslint-disable-next-line chai-friendly/no-unused-expressions
    globalAppRegistry.getAction('Status.Actions')?.hide();
    store.dispatch(changeErrorMessage(''));
    globalAppRegistry.emit('instance-refreshed', {
      ...store.getState(),
      errorMessage: '',
    });
  } catch (err) {
    // eslint-disable-next-line chai-friendly/no-unused-expressions
    globalAppRegistry.getAction('Status.Actions')?.hide();
    store.dispatch(changeErrorMessage(err.message));
    globalAppRegistry.emit('instance-refreshed', {
      ...store.getState(),
      errorMessage: err.message,
    });
  }
};

store.onActivated = (appRegistry) => {
  // Events emitted from the app registry:
  appRegistry.on('data-service-disconnected', () => {
    // eslint-disable-next-line chai-friendly/no-unused-expressions
    global.hadronApp.instance?.off();
    global.hadronApp.instance = null;
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

    store.dispatch(changeDataService(dataService));
    store.dispatch(changeInstance(instance));
    store.refreshInstance(appRegistry);
  });

  appRegistry.on('refresh-data', () => {
    store.refreshInstance(appRegistry);
  });

  appRegistry.on('agg-pipeline-out-executed', () => {
    store.refreshInstance(appRegistry);
  });
};

store.subscribe(() => {
  const state = store.getState();
  debug('App.InstanceStore changed to', state);
});

export default store;
