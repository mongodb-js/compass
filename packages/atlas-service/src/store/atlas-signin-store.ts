import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import type { AtlasService } from '../renderer';
import reducer from './atlas-signin-reducer';
import { atlasServiceLocator } from '../provider';

export function configureStore({
  atlasService,
}: {
  atlasService: AtlasService;
}) {
  return createStore(
    reducer,
    applyMiddleware(thunk.withExtraArgument({ atlasService }))
  );
}

export type AtlasServiceStore = ReturnType<typeof configureStore>;

let store: AtlasServiceStore;

export function getStore() {
  store ??= configureStore({
    atlasService: atlasServiceLocator(),
  });
  return store;
}
