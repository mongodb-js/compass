import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { AtlasAuthService } from '../renderer';
import reducer from './atlas-signin-reducer';

export function configureStore({
  atlasAuthService,
}: {
  atlasAuthService: AtlasAuthService;
}) {
  return createStore(
    reducer,
    applyMiddleware(thunk.withExtraArgument({ atlasAuthService }))
  );
}

export type AtlasServiceStore = ReturnType<typeof configureStore>;

let store: AtlasServiceStore;

export function getStore() {
  store ??= configureStore({
    atlasAuthService: new AtlasAuthService(),
  });
  return store;
}
