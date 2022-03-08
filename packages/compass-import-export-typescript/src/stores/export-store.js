import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

import reducer from '../modules';
import {
  dataServiceConnected,
  globalAppRegistryActivated,
} from '../modules/compass';
import { openExport } from '../modules/export';

const store = createStore(reducer, applyMiddleware(thunk));

store.onActivated = (globalAppRegistry) => {
  store.dispatch(globalAppRegistryActivated(globalAppRegistry));

  globalAppRegistry.on('data-service-connected', (err, dataService) => {
    store.dispatch(dataServiceConnected(err, dataService));
  });

  globalAppRegistry.on('open-export', ({ namespace, query, count }) => {
    store.dispatch(openExport({ namespace, query, count }));
  });
};

export default store;
