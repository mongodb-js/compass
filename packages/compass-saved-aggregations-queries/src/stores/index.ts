import type AppRegistry from 'hadron-app-registry';
import { createStore, applyMiddleware, combineReducers } from 'redux';
import thunk from 'redux-thunk';
import itemsReducer from './aggregations-queries-items';
import instanceReducer, { resetInstance, setInstance } from './instance';

const _store = createStore(
  combineReducers({
    savedItems: itemsReducer,
    instance: instanceReducer,
  }),
  applyMiddleware(thunk)
);

export type RootState = ReturnType<typeof _store.getState>;

const store = Object.assign(_store, {
  onActivated(appRegistry: AppRegistry) {
    appRegistry.on('instance-created', ({ instance }) => {
      store.dispatch(setInstance(instance));
    });

    appRegistry.on('instance-destroyed', () => {
      store.dispatch(resetInstance());
    });
  },
});

export default store;
