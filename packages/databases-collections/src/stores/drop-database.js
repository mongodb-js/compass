import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { appRegistryActivated } from '../modules/app-registry';
import { dataServiceConnected } from '../modules/data-service';
import reducer, { open } from '../modules/drop-database/drop-database';

export function activatePlugin(_, { globalAppRegistry }) {
  const store = createStore(reducer, applyMiddleware(thunk));
  store.dispatch(appRegistryActivated(globalAppRegistry));

  const onDataServiceConnected = (error, dataService) => {
    store.dispatch(dataServiceConnected(error, dataService));
  };

  globalAppRegistry.on('data-service-connected', onDataServiceConnected);

  const onOpenDropDatabase = (name) => {
    store.dispatch(open(name));
  };

  globalAppRegistry.on('open-drop-database', onOpenDropDatabase);

  return {
    store,
    deactivate() {
      globalAppRegistry.removeListener(
        'data-service-connected',
        onDataServiceConnected
      );
      globalAppRegistry.removeListener(
        'open-drop-database',
        onOpenDropDatabase
      );
    },
  };
}
