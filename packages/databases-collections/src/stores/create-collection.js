import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

import {
  dataServiceConnected,
  dataServiceUpdated,
} from '../modules/data-service';
import { serverVersionChanged } from '../modules/server-version';
import reducer, { open } from '../modules/create-collection';

export function activatePlugin(_, { globalAppRegistry }) {
  const store = createStore(reducer, applyMiddleware(thunk));

  const onDataServiceConnected = (error, dataService) => {
    store.dispatch(dataServiceConnected(error, dataService));
    if (dataService) {
      dataService.on('topologyDescriptionChanged', () => {
        store.dispatch(dataServiceUpdated(dataService));
      });
    }
  };

  globalAppRegistry.on('data-service-connected', onDataServiceConnected);

  const onInstanceCreated = ({ instance }) => {
    instance.build.on('change:version', () => {
      store.dispatch(serverVersionChanged(instance.build.version));
    });
  };

  globalAppRegistry.on('instance-created', onInstanceCreated);

  const onOpenCreateCollection = ({ database }) => {
    store.dispatch(open(database));
  };

  globalAppRegistry.on('open-create-collection', onOpenCreateCollection);

  return {
    store,
    deactivate() {
      globalAppRegistry.removeListener(
        'data-service-connected',
        onDataServiceConnected
      );
      globalAppRegistry.removeListener('instance-created', onInstanceCreated);
      globalAppRegistry.removeListener(
        'open-create-collection',
        onOpenCreateCollection
      );
    },
  };
}
