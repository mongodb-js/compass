import { createStore, applyMiddleware } from 'redux';
import reducer from 'modules';
import thunk from 'redux-thunk';

import { changeAuthentication } from 'modules/authentication';
import { changeErrorMessage } from 'modules/error-message';
import { toggleIsAtlas } from 'modules/is-atlas';
import { toggleIsDataLake } from 'modules/is-data-lake';
import { toggleIsConnected } from 'modules/is-connected';
import { changeSshTunnel } from 'modules/ssh-tunnel';
import { changeUiStatus } from 'modules/ui-status';
import { changeSsl } from 'modules/ssl';
import { updateTitle } from 'modules/title';
import { changeInstanceId } from 'modules/instance-id';
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
    store.dispatch(changeInstanceId(connection.instance_id));

    const StatusAction = appRegistry.getAction('Status.Actions');
    if (StatusAction) {
      StatusAction.configure({
        animation: true,
        message: 'Loading navigation',
        visible: true
      });
    }

    store.dispatch(toggleIsConnected(true));
    store.dispatch(toggleIsAtlas(/mongodb\.net/i.test(connection.hostname)));
    store.dispatch(changeAuthentication(connection.authentication));
    store.dispatch(changeSsl(connection.ssl));
    store.dispatch(changeSshTunnel(connection.ssh_tunnel));
    store.dispatch(changeUiStatus(UI_STATES.LOADING));
  });

  appRegistry.on('data-service-disconnected', () => {
    store.dispatch(dataServiceDisconnected(appRegistry));
  });

  appRegistry.on('select-database', (ns) => {
    store.dispatch(changeNamespace(ns));
    store.dispatch(updateTitle(ns));
  });

  appRegistry.on('database-selected', (ns) => {
    store.dispatch(changeNamespace(ns));
    store.dispatch(updateTitle(ns));
  });

  appRegistry.on('select-namespace', (ns) => {
    store.dispatch(changeNamespace(ns));
    store.dispatch(updateTitle(ns));
  });

  appRegistry.on('open-namespace-in-new-tab', (ns) => {
    store.dispatch(changeNamespace(ns));
    store.dispatch(updateTitle(ns));
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
