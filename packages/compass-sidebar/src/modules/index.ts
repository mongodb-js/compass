import type { Action, AnyAction } from 'redux';
import { combineReducers } from 'redux';
import type { AllDatabasesState, DatabasesAction } from './databases';
import databases from './databases';
import type { InstanceAction, InstanceState } from './instance';
import instance from './instance';
import type {
  ConnectionOptionsAction,
  ConnectionOptionsState,
} from './connection-options';
import connectionOptions from './connection-options';
import type { AppRegistry } from 'hadron-app-registry';
import type {
  IsPerformanceTabSupportedState,
  SetIsPerformanceTabSupportedAction,
} from './is-performance-tab-supported';
import isPerformanceTabSupported from './is-performance-tab-supported';
import type { ThunkAction } from 'redux-thunk';
import type { ConnectionsService } from '@mongodb-js/compass-connections/provider';
import type { MongoDBInstancesManager } from '@mongodb-js/compass-app-stores/provider';
import type { Logger } from '@mongodb-js/compass-logging/provider';

export interface RootState {
  connectionOptions: ConnectionOptionsState;
  databases: AllDatabasesState;
  instance: InstanceState;
  isPerformanceTabSupported: IsPerformanceTabSupportedState;
}

export type RootAction =
  | ConnectionOptionsAction
  | DatabasesAction
  | InstanceAction
  | SetIsPerformanceTabSupportedAction;

export type SidebarThunkAction<R, A extends Action = AnyAction> = ThunkAction<
  R,
  RootState,
  {
    globalAppRegistry: AppRegistry;
    connections: ConnectionsService;
    instancesManager: MongoDBInstancesManager;
    logger: Logger;
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
  isPerformanceTabSupported,
});

export default reducer;
