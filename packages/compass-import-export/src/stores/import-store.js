import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

import reducer from '../modules';
import {
  dataServiceConnected,
  globalAppRegistryActivated,
} from '../modules/compass';
import { openImport } from '../modules/import';

const store = createStore(reducer, applyMiddleware(thunk));

store.onActivated = (globalAppRegistry) => {
  store.dispatch(globalAppRegistryActivated(globalAppRegistry));

  globalAppRegistry.on('data-service-connected', (err, dataService) => {
    store.dispatch(dataServiceConnected(err, dataService));
  });

  globalAppRegistry.on('open-import', ({ namespace }) => {
    store.dispatch(openImport(namespace));
  });
};

export default store;
