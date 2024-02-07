import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import reducer from './atlas-signin-reducer';
import { atlasServicesLocator, type AtlasServices } from '../provider';

export function configureStore({
  atlasServices,
}: {
  atlasServices: AtlasServices;
}) {
  return createStore(
    reducer,
    applyMiddleware(
      thunk.withExtraArgument({
        atlasServices,
      })
    )
  );
}

export type AtlasServiceStore = ReturnType<typeof configureStore>;

let store: AtlasServiceStore;

export function getStore() {
  store ??= configureStore({
    atlasServices: atlasServicesLocator(),
  });
  return store;
}
