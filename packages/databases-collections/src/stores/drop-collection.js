import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { appRegistryActivated } from '../modules/app-registry';
import { dataServiceConnected } from '../modules/data-service';
import reducer, { open } from '../modules/drop-collection/drop-collection';

export function activatePlugin(_, { globalAppRegistry }) {
  const store = createStore(reducer, applyMiddleware(thunk));
  store.dispatch(appRegistryActivated(globalAppRegistry));

  const onDataServiceConnected = (error, dataService) => {
    store.dispatch(dataServiceConnected(error, dataService));
  };

  globalAppRegistry.on('data-service-connected', onDataServiceConnected);

  const onOpenDropCollection = ({ database, collection }) => {
    store.dispatch(open(collection, database));
  };

  globalAppRegistry.on('open-drop-collection', onOpenDropCollection);

  return {
    store,
    deactivate() {
      globalAppRegistry.removeListener(
        'data-service-connected',
        onDataServiceConnected
      );
      globalAppRegistry.removeListener(
        'open-drop-collection',
        onOpenDropCollection
      );
    },
  };
}
