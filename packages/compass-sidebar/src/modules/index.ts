import { combineReducers } from 'redux';

import appRegistry from '@mongodb-js/mongodb-redux-common/app-registry';
import type { DatabaseState, DatabasesAction } from './databases';
import databases from './databases';
import type { InstanceAction, InstanceState } from './instance';
import instance from './instance';
import type {
  IsDetailsExpandedState,
  ToggleIsDetailsExpandedAction,
} from './is-details-expanded';
import isDetailsExpanded from './is-details-expanded';
import type {
  IsGenuineMongoDBVisibleAction,
  IsGenuineMongoDBVisibleState,
} from './is-genuine-mongodb-visible';
import isGenuineMongoDBVisible from './is-genuine-mongodb-visible';
import type {
  ConnectionInfoAction,
  ConnectionInfoState,
} from './connection-info';
import connectionInfo from './connection-info';
import type {
  ConnectionOptionsAction,
  ConnectionOptionsState,
} from './connection-options';
import connectionOptions from './connection-options';
import type { IsExpandedAction, IsExpandedState } from './is-expanded';
import isExpanded from './is-expanded';
import type { AppRegistry } from 'hadron-app-registry';
import type { DataServiceAction, DataServiceState } from './data-service';
import dataService from './data-service';

export interface RootState {
  appRegistry: {
    globalAppRegistry: AppRegistry | null;
    localAppRegistry: AppRegistry | null;
  };
  dataService: DataServiceState;
  connectionInfo: ConnectionInfoState;
  connectionOptions: ConnectionOptionsState;
  databases: DatabaseState;
  instance: InstanceState;
  isDetailsExpanded: IsDetailsExpandedState;
  isGenuineMongoDBVisible: IsGenuineMongoDBVisibleState;
  isExpanded: IsExpandedState;
}

export type RootAction =
  | ConnectionInfoAction
  | ConnectionOptionsAction
  | DatabasesAction
  | InstanceAction
  | ToggleIsDetailsExpandedAction
  | IsGenuineMongoDBVisibleAction
  | IsExpandedAction
  | DataServiceAction;

/**
 * The reducer.
 */
const reducer = combineReducers<RootState, RootAction>({
  appRegistry,
  databases,
  dataService,
  connectionInfo,
  connectionOptions,
  instance,
  isDetailsExpanded,
  isGenuineMongoDBVisible,
  isExpanded,
});

export default reducer;
