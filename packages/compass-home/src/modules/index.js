import { combineReducers } from 'redux';

import authentication, {
  INITIAL_STATE as AUTH_INITIAL_STATE
} from 'modules/authentication';
import errorMessage, {
  INITIAL_STATE as ERROR_MESSAGE_INITIAL_STATE
} from 'modules/error-message';
import isAtlas, {
  INITIAL_STATE as IS_ATLAS_INITIAL_STATE
} from 'modules/is-atlas';
import isCollapsed, {
  INITIAL_STATE as IS_COLLAPSED_INITIAL_STATE
} from 'modules/is-collapsed';
import isConnected, {
  INITIAL_STATE as IS_CONNECTED_INITIAL_STATE
} from 'modules/is-connected';
import namespace, {
  INITIAL_STATE as NAMESPACE_INITIAL_STATE
} from 'modules/namespace';
import sshTunnel, {
  INITIAL_STATE as SSH_TUNNEL_INITIAL_STATE
} from 'modules/ssh-tunnel';
import ssl, {
  INITIAL_STATE as SSL_INITIAL_STATE
} from 'modules/ssl';
import uiStatus, {
  INITIAL_STATE as UI_STATUS_INITIAL_STATE
} from 'modules/ui-status';
import instanceId, {
  INITIAL_STATE as INSTANCE_ID_INITIAL_STATE
} from 'modules/instance-id';
import title, {
  INITIAL_STATE as TITLE_INITIAL_STATE
} from 'modules/title';
import { RESET, reset } from 'modules/reset';
import UI_STATES from 'constants/ui-states';

/**
 * The reducer.
 */
const reducer = combineReducers({
  authentication,
  errorMessage,
  isAtlas,
  isCollapsed,
  isConnected,
  namespace,
  sshTunnel,
  ssl,
  uiStatus,
  instanceId,
  title
});

/**
 * The root reducer.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const rootReducer = (state, action) => {
  if (action.type === RESET) {
    return {
      ...state,
      authentication: AUTH_INITIAL_STATE,
      errorMessage: ERROR_MESSAGE_INITIAL_STATE,
      isAtlas: IS_ATLAS_INITIAL_STATE,
      isCollapsed: IS_COLLAPSED_INITIAL_STATE,
      isConnected: IS_CONNECTED_INITIAL_STATE,
      namespace: NAMESPACE_INITIAL_STATE,
      sshTunnel: SSH_TUNNEL_INITIAL_STATE,
      ssl: SSL_INITIAL_STATE,
      uiStatus: UI_STATUS_INITIAL_STATE,
      title: TITLE_INITIAL_STATE,
      instanceId: INSTANCE_ID_INITIAL_STATE
    };
  }
  return reducer(state, action);
};

export const dataServiceDisconnected = (appRegistry) => {
  return (dispatch, getState) => {
    const state = getState();
    if (state.uiStatus === UI_STATES.COMPLETE || state.uiStatus === UI_STATES.INITIAL) {
      const StatusAction = appRegistry.getAction('Status.Actions');
      dispatch(reset());
      if (StatusAction) StatusAction.done();
    } else {
      const timer = setInterval(() => {
        if (state.uiStatus === UI_STATES.COMPLETE) {
          const StatusAction = appRegistry.getAction('Status.Actions');
          dispatch(reset());
          if (StatusAction) StatusAction.done();
          clearInterval(timer);
        }
      }, 500);
    }
  };
};

export default rootReducer;
