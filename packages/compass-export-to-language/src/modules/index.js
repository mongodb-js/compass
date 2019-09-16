import { combineReducers } from 'redux';
import appRegistry, {
  INITIAL_STATE as APP_REGISTRY_STATE
} from 'mongodb-redux-common/app-registry';
import exportQuery, { INITIAL_STATE as EXPORT_INITIAL_STATE } from './export-query';

export const INITIAL_STATE = {
  exportQuery: EXPORT_INITIAL_STATE,
  appRegistry: APP_REGISTRY_STATE
};

/**
 * The reducer.
 */
const reducer = combineReducers({
  exportQuery,
  appRegistry
});

export default reducer;
