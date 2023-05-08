import { combineReducers } from 'redux';

import { ns, dataService, globalAppRegistry } from './compass';

import importData from './import';

const rootReducer = combineReducers({
  globalAppRegistry,
  dataService,
  ns,
  importData,
});

export default rootReducer;
