import { combineReducers } from 'redux';
import appRegistry from '@mongodb-js/mongodb-redux-common/app-registry';
import preferencesReadOnly from './preferences-readonly';
import runtime from './runtime';

const reducer = combineReducers({
  appRegistry,
  preferencesReadOnly,
  runtime
});

export default reducer;
