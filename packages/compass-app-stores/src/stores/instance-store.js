import { createStore } from 'redux';
import reducer from 'modules/instance';

import MongoDBInstance from 'mongodb-instance-model';
import { reset } from 'modules/instance/reset';
import { changeInstance } from 'modules/instance/instance';
import { changeErrorMessage } from 'modules/instance/error-message';
import { changeDataService } from 'modules/instance/data-service';

const store = createStore(reducer);

store.handleError = (model, resp, options) => {
  const err = options.error.arguments[2];
  if (err) {
    store.dispatch(changeErrorMessage(err));
  }

  const StatusAction = global.hadronApp.appRegistry.getAction('Status.Actions');
  if (StatusAction) StatusAction.hide();
  const state = {
    errorMessage: err,
    dataService: store.getState().dataService,
    instance: store.getState().instance
  };
  global.hadronApp.appRegistry.emit('instance-refreshed', state);
};

store.refreshInstance = () => {
  if (store.getState().instance.fetch) {
    const StatusAction = global.hadronApp.appRegistry.getAction('Status.Actions');
    if (StatusAction) {
      StatusAction.configure({
        animation: true,
        message: 'Loading databases',
        visible: true
      });
    }
    store.getState().instance.fetch({
      error: store.handleError,
      success: function(instance) {
        store.dispatch(changeInstance(instance));
        if (StatusAction) StatusAction.hide();
        /* Emit here because ampersand changes don't trigger rerenders on their own */
        const state = {
          dataService: store.getState().dataService,
          errorMessage: store.getState().errorMessage,
          instance: instance
        };
        global.hadronApp.appRegistry.emit('instance-refreshed', state);
      },
      dataService: store.getState().dataService
    });
  }
};

store.onActivated = (appRegistry) => {
  // Events emitted from the app registry:
  appRegistry.on('data-service-disconnected', () => {
    global.hadronApp.instance = new MongoDBInstance();
    store.dispatch(reset());
  });

  appRegistry.on('data-service-connected', (err, ds) => {
    if (!err) {
      store.dispatch(changeDataService(ds));
    } else {
      store.dispatch(changeErrorMessage(err.message));
    }
    // Was previously onFirstFetch action, which was triggered from data-service-connected in the home plugin
    const StatusAction = appRegistry.getAction('Status.Actions');
    if (StatusAction) StatusAction.hide();
    store.dispatch(changeInstance(global.hadronApp.instance));

    if (!err) {
      store.refreshInstance();
    } else {
      const state = {
        dataService: null,
        errorMessage: err.message,
        instance: global.hadronApp.instance
      };
      global.hadronApp.appRegistry.emit('instance-refreshed', state);
    }
  });

  appRegistry.on('refresh-data', () => {
    store.refreshInstance();
  });

  appRegistry.on('agg-pipeline-out-executed', () => {
    store.refreshInstance();
  });
};

export default store;
