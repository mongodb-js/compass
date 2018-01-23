import { combineReducers } from 'redux';

import view, { INITIAL_STATE as VIEW_INITIAL_STATE } from './view';
import fields, { INITIAL_STATE as FIELDS_INITIAL_STATE } from './fields';
import serverVersion, { INITIAL_STATE as SV_INITIAL_STATE } from './server-version';
import stages, { INITIAL_STATE as STAGE_INITIAL_STATE } from './stages';
import namespace, {
  INITIAL_STATE as NS_INITIAL_STATE,
  NAMESPACE_CHANGED
} from './namespace';

export const INITIAL_STATE = {
  namespace: NS_INITIAL_STATE,
  fields: FIELDS_INITIAL_STATE,
  serverVersion: SV_INITIAL_STATE,
  stages: STAGE_INITIAL_STATE,
  view: VIEW_INITIAL_STATE
};

const appReducer = combineReducers({
  namespace,
  fields,
  serverVersion,
  stages,
  view
});

const rootReducer = (state, action) => {
  /* Actions that need to reset the rest of the state to initial state */
  if (action.type === NAMESPACE_CHANGED) {
    state = INITIAL_STATE;
  }
  return appReducer(state, action);
};

export default rootReducer;
