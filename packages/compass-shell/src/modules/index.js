import { combineReducers } from 'redux';
import appRegistry from '@mongodb-js/mongodb-redux-common/app-registry';
import enableShell from './enable-shell';
import runtime from './runtime';

const reducer = combineReducers({
  appRegistry,
  enableShell,
  runtime
});

export default reducer;
