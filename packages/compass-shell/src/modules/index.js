import { combineReducers } from 'redux';
import appRegistry from '@mongodb-js/mongodb-redux-common/app-registry';
import preferencesReadOnly from './preferences-readonly';
import enableShell from './enable-shell';
import runtime from './runtime';

const reducer = combineReducers({
  appRegistry,
  preferencesReadOnly,
  enableShell,
  runtime
});

export default reducer;
