import type { Action, AnyAction } from 'redux';
import { combineReducers } from 'redux';
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
import type { AppRegistry } from 'hadron-app-registry';
import type { DataServiceAction, DataServiceState } from './data-service';
import dataService from './data-service';
import type {
  IsPerformanceTabSupportedState,
  SetIsPerformanceTabSupportedAction,
} from './is-performance-tab-supported';
import isPerformanceTabSupported from './is-performance-tab-supported';
import type { ThunkAction } from 'redux-thunk';

export interface RootState {
  dataService: DataServiceState;
  connectionInfo: ConnectionInfoState;
  connectionOptions: ConnectionOptionsState;
  databases: DatabaseState;
  instance: InstanceState;
  isDetailsExpanded: IsDetailsExpandedState;
  isGenuineMongoDBVisible: IsGenuineMongoDBVisibleState;
  isPerformanceTabSupported: IsPerformanceTabSupportedState;
}

export type RootAction =
  | ConnectionInfoAction
  | ConnectionOptionsAction
  | DatabasesAction
  | InstanceAction
  | ToggleIsDetailsExpandedAction
  | IsGenuineMongoDBVisibleAction
  | DataServiceAction
  | SetIsPerformanceTabSupportedAction;

export type SidebarThunkAction<R, A extends Action = AnyAction> = ThunkAction<
  R,
  RootState,
  { globalAppRegistry: AppRegistry },
  A
>;

/**
 * The reducer.
 */
const reducer = combineReducers<RootState, RootAction>({
  databases,
  dataService,
  connectionInfo,
  connectionOptions,
  instance,
  isDetailsExpanded,
  isGenuineMongoDBVisible,
  isPerformanceTabSupported,
});

export default reducer;
