import { createStore } from 'redux';
import reducer from 'modules/collection';

import { reset } from 'modules/collection/reset';
import { changeCollection } from 'modules/collection/collection';
import { changeActiveTabIndex } from 'modules/collection/active-tab-index';
import { changeTabs } from 'modules/collection/tabs';

const debug = require('debug')('mongodb-compass:stores:CollectionStore');

const store = createStore(reducer);

store.onActivated = (appRegistry) => {
  // Events emitted from the app registry:
  appRegistry.on('data-service-disconnected', () => {
    store.dispatch(reset());
  });

  appRegistry.on('show-agg-pipeline-out-results', (ns) => {
    store.dispatch(changeCollection({
      _id: ns,
      readonly: false,
      capped: false,
      isCustomCollation: false
    }));
    store.dispatch(changeActiveTabIndex(0));
  });
};

store.setCollection = (collection) => {
  const nsStore = global.hadronApp.appRegistry.getStore('App.NamespaceStore');
  store.dispatch(changeCollection(collection));
  if (collection._id) {
    nsStore.ns = collection._id;
  }
};

store.setTabs = (tabs) => {
  store.dispatch(changeTabs(tabs));
};

store.setActiveTab = (idx) => {
  store.dispatch(changeActiveTabIndex(idx));
  const tabs = store.getState().tabs;
  global.hadronApp.appRegistry.emit('active-tab-changed', tabs[idx]);
};

store.getActiveTab = () => (store.getState().activeTabIndex);
store.ns = () => (store.getState().collection._id);
store.isReadonly = () => (store.getState().collection.readonly);

Object.defineProperty(store, 'collection', {
  get: () => (store.getState().collection),

  set: (collection) => {
    return store.setCollection(collection);
  }
});

store.subscribe(() => {
  const state = store.getState();
  debug('App.CollectionStore changed to', state);
});

export default store;
