import { combineReducers } from 'redux';

import appRegistry from '@mongodb-js/mongodb-redux-common/app-registry';
import type { DatabaseState, DatabasesAction } from './databases';
import databases, {
  INITIAL_STATE as DATABASES_INITIAL_STATE,
} from './databases';
import type { InstanceAction, InstanceState } from './instance';
import instance, { INITIAL_STATE as INSTANCE_INITIAL_STATE } from './instance';
import type {
  IsDetailsExpandedState,
  ToggleIsDetailsExpandedAction,
} from './is-details-expanded';
import isDetailsExpanded, {
  INITIAL_STATE as IS_DETAILS_EXPANDED_INITIAL_STATE,
} from './is-details-expanded';
import type { ResetAction } from './reset';
import { RESET } from './reset';
import type {
  IsGenuineMongoDBVisibleAction,
  IsGenuineMongoDBVisibleState,
} from './is-genuine-mongodb-visible';
import isGenuineMongoDBVisible, {
  INITIAL_STATE as IS_VISIBLE_IS,
} from './is-genuine-mongodb-visible';
import type {
  ConnectionInfoAction,
  ConnectionInfoState,
} from './connection-info';
import connectionInfo, {
  INITIAL_STATE as CONNECTION_INFO_IS,
} from './connection-info';
import type {
  ConnectionOptionsAction,
  ConnectionOptionsState,
} from './connection-options';
import connectionOptions, {
  INITIAL_STATE as CONNECTION_OPTIONS_IS,
} from './connection-options';
import type { LocationAction, LocationState } from './location';
import location, { INITIAL_STATE as LOCATION_IS } from './location';
import type { IsExpandedAction, IsExpandedState } from './is-expanded';
import isExpanded, { INITIAL_STATE as IS_EXPANDED_IS } from './is-expanded';
import type { AppRegistry } from 'hadron-app-registry';

export interface RootState {
  appRegistry: {
    globalAppRegistry: AppRegistry | null;
    localAppRegistry: AppRegistry | null;
  };
  connectionInfo: ConnectionInfoState;
  connectionOptions: ConnectionOptionsState;
  databases: DatabaseState;
  instance: InstanceState;
  isDetailsExpanded: IsDetailsExpandedState;
  isGenuineMongoDBVisible: IsGenuineMongoDBVisibleState;
  location: LocationState;
  isExpanded: IsExpandedState;
}

export type RootAction =
  | ConnectionInfoAction
  | ConnectionOptionsAction
  | DatabasesAction
  | InstanceAction
  | ToggleIsDetailsExpandedAction
  | IsGenuineMongoDBVisibleAction
  | LocationAction
  | IsExpandedAction
  | ResetAction;

/**
 * The reducer.
 */
const reducer = combineReducers<RootState, RootAction>({
  appRegistry,
  databases,
  connectionInfo,
  connectionOptions,
  instance,
  isDetailsExpanded,
  isGenuineMongoDBVisible,
  location,
  isExpanded,
});

/**
 * The root reducer.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const rootReducer = (
  state: RootState | undefined,
  action: RootAction
): RootState => {
  if (action.type === RESET || !state) {
    return {
      appRegistry: { globalAppRegistry: null, localAppRegistry: null },
      ...state,
      connectionInfo: CONNECTION_INFO_IS,
      connectionOptions: CONNECTION_OPTIONS_IS,
      databases: DATABASES_INITIAL_STATE,
      instance: INSTANCE_INITIAL_STATE,
      isDetailsExpanded: IS_DETAILS_EXPANDED_INITIAL_STATE,
      isGenuineMongoDBVisible: IS_VISIBLE_IS,
      location: LOCATION_IS,
      isExpanded: IS_EXPANDED_IS,
    };
  }
  return reducer(state, action);
};

export default rootReducer;
