import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { AtlasService } from '../renderer';
import reducer from './atlas-signin-reducer';

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

let store: ReturnType<typeof configureStore>;

export function getStore() {
  store ??= configureStore({
    atlasService: new AtlasService(),
  });
  return store;
}

export const dispatch = (...args: Parameters<typeof store.dispatch>) => {
  return getStore().dispatch(...args);
};
