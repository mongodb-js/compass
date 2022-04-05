import {
  applyMiddleware,
  compose,
  createStore as reduxCreateStore
} from 'redux';

import reduxThunk from 'redux-thunk';

import rootReducer from '../modules';

let composeEnhancers = compose;

if (
  process.env.NODE_ENV !== 'production' &&
  typeof window === 'object' &&
  window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
) {
  composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__;
}

export function configureStore(preloadedState = {}) {
  const store = reduxCreateStore(
    rootReducer,
    preloadedState,
    composeEnhancers(applyMiddleware(reduxThunk))
  );

  if (module.hot) {
    // Enable Webpack hot module replacement for reducers.
    // https://github.com/reactjs/react-redux/releases/tag/v2.0.0
    module.hot.accept('../modules', () => {
      const nextRootReducer = require('../modules');
      store.replaceReducer(nextRootReducer);
    });
  }

  return store;
}

import rootCreateViewReducer from '../modules/create-view';

export function configureCreateViewStore(preloadedState = {}) {
  const store = reduxCreateStore(
    rootCreateViewReducer,
    preloadedState,
    composeEnhancers(applyMiddleware(reduxThunk))
  );

  if (module.hot) {
    module.hot.accept('../modules/create-view', () => {
      const nextRootReducer = require('../modules/create-view');
      store.replaceReducer(nextRootReducer);
    });
  }

  return store;
}
