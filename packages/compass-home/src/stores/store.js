import { createStore, applyMiddleware } from 'redux';
import reducer from 'modules';
import thunk from 'redux-thunk';

import { changeErrorMessage } from 'modules/error-message';
import { toggleIsDataLake } from 'modules/is-data-lake';
import { toggleIsConnected } from 'modules/is-connected';
import { changeUiStatus } from 'modules/ui-status';
import { updateTitle } from 'modules/title';
import { changeConnectionTitle } from 'modules/connection-title';
import { changeNamespace } from 'modules/namespace';
import { dataServiceDisconnected } from 'modules';

const debug = require('debug')('mongodb-compass:stores:HomeStore');

import UI_STATES from 'constants/ui-states';

const store = createStore(reducer, applyMiddleware(thunk));


store.onActivated = (appRegistry) => {
  appRegistry.on('instance-refreshed', (state) => {
    if (state.errorMessage) {
      store.dispatch(changeErrorMessage(state.errorMessage));
      store.dispatch(changeUiStatus(UI_STATES.ERROR));
      return;
    }
    store.dispatch(changeUiStatus(UI_STATES.COMPLETE));
    store.dispatch(updateTitle());
    if (state.instance.dataLake && state.instance.dataLake.isDataLake) {
      store.dispatch(toggleIsDataLake(true));
    }
  });

  appRegistry.on('data-service-connected', (err, ds) => {
    if (err) {
      store.dispatch(changeErrorMessage(err.message));
      store.dispatch(changeUiStatus(UI_STATES.ERROR));
      return;
    }
    const connection = ds.client.model;

    store.dispatch(changeConnectionTitle(connection.title || ''));

    const StatusAction = appRegistry.getAction('Status.Actions');
    if (StatusAction) {
      StatusAction.configure({
        animation: true,
        message: 'Loading navigation',
        visible: true
      });
    }

    store.dispatch(toggleIsConnected(true));
    store.dispatch(changeUiStatus(UI_STATES.LOADING));
  });

  appRegistry.on('data-service-disconnected', () => {
    store.dispatch(dataServiceDisconnected(appRegistry));
  });

  appRegistry.on('select-database', (ns) => {
    store.dispatch(changeNamespace(ns));
    store.dispatch(updateTitle(ns));
  });

  appRegistry.on('select-namespace', (meta) => {
    store.dispatch(changeNamespace(meta.namespace));
    store.dispatch(updateTitle(meta.namespace));
  });

  appRegistry.on('select-instance', () => {
    store.dispatch(changeNamespace(''));
    store.dispatch(updateTitle(''));
  });

  appRegistry.on('open-namespace-in-new-tab', (meta) => {
    store.dispatch(changeNamespace(meta.namespace));
    store.dispatch(updateTitle(meta.namespace));
  });

  appRegistry.on('all-collection-tabs-closed', () => {
    store.dispatch(changeNamespace(''));
    store.dispatch(updateTitle(''));
  });
};

store.subscribe(() => {
  const state = store.getState();
  debug('Home.Store changed to', state);
});

export default store;
