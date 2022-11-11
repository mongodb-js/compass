import { combineReducers } from 'redux';
import appRegistry from '@mongodb-js/mongodb-redux-common/app-registry';
import runtime from './runtime';

const reducer = combineReducers({
  appRegistry,
  runtime
});

export default reducer;
