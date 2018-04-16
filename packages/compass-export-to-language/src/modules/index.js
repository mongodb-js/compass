import { combineReducers } from 'redux';
import exportQuery, { INITIAL_STATE as EXPORT_INITIAL_STATE } from './export-query';

export const INITIAL_STATE = {
  exportQuery: EXPORT_INITIAL_STATE
}

/**
 * The reducer.
 */
const reducer = combineReducers({
  exportQuery 
});

export default reducer;
