import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { dataServiceConnected } from '../modules/data-service';
import reducer, { open } from '../modules/create-view';

/**
 * @param {import('hadron-app-registry').AppRegistry} appRegistry
 * @returns {{ store: any, deactivate: () => void }}
 */
export function activateCreateViewPlugin(_, { globalAppRegistry }) {
  const store = createStore(
    reducer,
    applyMiddleware(
      thunk.withExtraArgument({ globalAppRegistry: globalAppRegistry })
    )
  );

  const onDataServiceConnected = (error, dataService) => {
    store.dispatch(dataServiceConnected(error, dataService));
  };

  globalAppRegistry.on('data-service-connected', onDataServiceConnected);

  const onOpenCreateView = (meta) => {
    store.dispatch(open(meta.source, meta.pipeline, meta.duplicate ?? false));
  };

  globalAppRegistry.on('open-create-view', onOpenCreateView);

  return {
    store,
    deactivate() {
      globalAppRegistry.removeListener(
        'data-service-connected',
        onDataServiceConnected
      );
      globalAppRegistry.removeListener('open-create-view', onOpenCreateView);
    },
  };
}
