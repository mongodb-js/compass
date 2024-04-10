import type { Action, AnyAction } from 'redux';
import { combineReducers } from 'redux';
import type { DatabaseState, DatabasesAction } from './databases';
import databases from './databases';
import type { InstanceAction, InstanceState } from './instance';
import instance from './instance';
import type {
  IsGenuineMongoDBVisibleAction,
  IsGenuineMongoDBVisibleState,
} from './is-genuine-mongodb-visible';
import isGenuineMongoDBVisible from './is-genuine-mongodb-visible';
import type {
  ConnectionOptionsAction,
  ConnectionOptionsState,
} from './connection-options';
import connectionOptions from './connection-options';
import type { AppRegistry } from 'hadron-app-registry';
import type { DataServiceAction, DataServiceState } from './data-service';
import type {
  IsPerformanceTabSupportedState,
  SetIsPerformanceTabSupportedAction,
} from './is-performance-tab-supported';
import isPerformanceTabSupported from './is-performance-tab-supported';
import type { ThunkAction } from 'redux-thunk';
import { ConnectionsManager } from '@mongodb-js/compass-connections/provider';
import { MongoDBInstancesManager } from '@mongodb-js/compass-app-stores/provider';
import { LoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';

export interface RootState {
  connectionOptions: ConnectionOptionsState;
  databases: DatabaseState;
  instance: InstanceState;
  isGenuineMongoDBVisible: IsGenuineMongoDBVisibleState;
  isPerformanceTabSupported: IsPerformanceTabSupportedState;
}

export type RootAction =
  | ConnectionOptionsAction
  | DatabasesAction
  | InstanceAction
  | IsGenuineMongoDBVisibleAction
  | DataServiceAction
  | SetIsPerformanceTabSupportedAction;

export type SidebarThunkAction<R, A extends Action = AnyAction> = ThunkAction<
  R,
  RootState,
  {
    globalAppRegistry: AppRegistry;
    connectionsManager: ConnectionsManager;
    instancesManager: MongoDBInstancesManager;
    logger: LoggerAndTelemetry;
  },
  A
>;

/**
 * The reducer.
 */
const reducer = combineReducers<RootState, RootAction>({
  databases,
  connectionOptions,
  instance,
  isGenuineMongoDBVisible,
  isPerformanceTabSupported,
});

export default reducer;
