import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

import { dataServiceConnected } from '../modules/data-service';
import { serverVersionChanged } from '../modules/server-version';
import reducer, { open } from '../modules/create-database';

export function activatePlugin(_, { globalAppRegistry }) {
  const store = createStore(reducer, applyMiddleware(thunk));

  const onDataServiceConnected = (error, dataService) => {
    store.dispatch(dataServiceConnected(error, dataService));
  };

  globalAppRegistry.on('data-service-connected', onDataServiceConnected);

  const onInstanceCreated = ({ instance }) => {
    instance.build.on('change:version', () => {
      store.dispatch(serverVersionChanged(instance.build.version));
    });
  };

  globalAppRegistry.on('instance-created', onInstanceCreated);

  const onOpenCreateDatabase = () => {
    store.dispatch(open());
  };

  globalAppRegistry.on('open-create-database', onOpenCreateDatabase);

  return {
    store,
    deactivate() {
      globalAppRegistry.removeListener(
        'data-service-connected',
        onDataServiceConnected
      );
      globalAppRegistry.removeListener('instance-created', onInstanceCreated);
      globalAppRegistry.removeListener(
        'open-create-database',
        onOpenCreateDatabase
      );
    },
  };
}
