import { combineReducers } from 'redux';

import { ns, dataService, globalAppRegistry } from './compass';

import exportData from './export';
import importData from './import';

const rootReducer = combineReducers({
  globalAppRegistry,
  dataService,
  ns,
  exportData,
  importData
});

export default rootReducer;
