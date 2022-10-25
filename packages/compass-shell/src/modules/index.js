import { combineReducers } from 'redux';
import appRegistry from '@mongodb-js/mongodb-redux-common/app-registry';
import isReadonly from './is-readonly';
import runtime from './runtime';

const reducer = combineReducers({
  appRegistry,
  runtime,
  isReadonly
});

export default reducer;
