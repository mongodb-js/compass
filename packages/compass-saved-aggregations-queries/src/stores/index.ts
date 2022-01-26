import type AppRegistry from 'hadron-app-registry';
import { Store, createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

import reducer, { State } from './aggregations-queries-items';

const store: Store<State> & {
  onActivated(appRegistry: AppRegistry): void;
} = Object.assign(createStore(reducer, applyMiddleware(thunk)), {
  onActivated() {
    // initial setup
  },
});

export default store;
