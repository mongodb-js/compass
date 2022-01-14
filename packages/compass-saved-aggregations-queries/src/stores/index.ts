import type AppRegistry from 'hadron-app-registry';
import { Store, createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import reducer from './aggregations-queries-items';

const store: Store<ReturnType<typeof reducer>> & {
  onActivated(appRegistry: AppRegistry): void;
} = Object.assign(createStore(reducer, applyMiddleware(thunk)), {
  onActivated() {
    // initial setup
  },
});

export default store;
