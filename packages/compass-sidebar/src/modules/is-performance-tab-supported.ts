import { ConnectionInfo } from '@mongodb-js/connection-info';
import type { RootAction } from '.';

const SET_IS_PERFORMANCE_TAB_SUPPORTED =
  'compass-sidebar/SET_IS_PERFORMANCE_TAB_SUPPORTED';

export type SetIsPerformanceTabSupportedAction = {
  type: typeof SET_IS_PERFORMANCE_TAB_SUPPORTED;
  connectionId: ConnectionInfo['id'];
  isSupported: boolean;
};

export function setIsPerformanceTabSupported(
  connectionId: ConnectionInfo['id'],
  isSupported: boolean
): SetIsPerformanceTabSupportedAction {
  return {
    type: SET_IS_PERFORMANCE_TAB_SUPPORTED,
    connectionId,
    isSupported,
  };
}

export type IsPerformanceTabSupportedSingleState = boolean | null;
export type IsPerformanceTabSupportedState = Record<
  ConnectionInfo['id'],
  IsPerformanceTabSupportedSingleState
>;

const reducer = (
  state: IsPerformanceTabSupportedState = {},
  action: RootAction
): IsPerformanceTabSupportedState => {
  if (action.type === SET_IS_PERFORMANCE_TAB_SUPPORTED) {
    return {
      ...state,
      [action.connectionId]: action.isSupported,
    };
  }

  return state;
};

export default reducer;
