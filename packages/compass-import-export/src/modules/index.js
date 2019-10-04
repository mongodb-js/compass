import { combineReducers } from 'redux';

import { ns, dataService, appRegistry, globalAppRegistry } from './compass';

import stats from './stats';
import exportData from './export';
import importData from './import';

const rootReducer = combineReducers({
  appRegistry,
  globalAppRegistry,
  dataService,
  ns,
  stats,
  exportData,
  importData
});

export default rootReducer;
