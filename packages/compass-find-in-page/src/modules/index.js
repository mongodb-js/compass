import { combineReducers } from 'redux';
import findInPage, { INITIAL_STATE as EXPORT_INITIAL_STATE } from './find-in-page';

export const INITIAL_STATE = {
  findInPage: EXPORT_INITIAL_STATE
};

/**
 * The reducer.
 */
const reducer = combineReducers({
  findInPage
});

export default reducer;
