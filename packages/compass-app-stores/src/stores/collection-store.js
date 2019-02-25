import { createStore, applyMiddleware } from 'redux';
import reducer from 'modules/collection';
import thunk from 'redux-thunk';

import { reset } from 'modules/collection/reset';
import { changeCollection } from 'modules/collection/collection';
import { changeActiveTabIndex } from 'modules/collection/active-tab-index';
import { changeTabs } from 'modules/collection/tabs';

const store = createStore(reducer, applyMiddleware(thunk));

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
  if (collection._id) {
    nsStore.ns = collection._id;
  }
  store.dispatch(changeCollection(collection));
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

export default store;
