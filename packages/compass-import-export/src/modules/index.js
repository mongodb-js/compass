import { combineReducers } from 'redux';
import { combineEpics } from 'redux-observable';

import ns from './ns';
import dataService from './data-service';
import stats from './stats';
import exportData, { exportStartedEpic } from './export';
import importData, { importStartedEpic } from './import';

/**
 * The root reducer for the store.
 *
 * @returns {Function} The reducer.
 */
export const rootReducer = combineReducers({
  ns,
  dataService,
  stats,
  exportData,
  importData
});

/**
 * The root epic for the store.
 *
 * @returns {Function} The root epic.
 */
export const rootEpic = combineEpics(
  exportStartedEpic,
  importStartedEpic
);
