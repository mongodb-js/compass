import type { RootAction } from '.';

const SET_IS_PERFORMANCE_TAB_SUPPORTED =
  'compass-sidebar/SET_IS_PERFORMANCE_TAB_SUPPORTED';

export type SetIsPerformanceTabSupportedAction = {
  type: typeof SET_IS_PERFORMANCE_TAB_SUPPORTED;
  isSupported: boolean;
};

export function setIsPerformanceTabSupported(
  isSupported: boolean
): SetIsPerformanceTabSupportedAction {
  return {
    type: SET_IS_PERFORMANCE_TAB_SUPPORTED,
    isSupported,
  };
}

export type IsPerformanceTabSupportedState = boolean | null;

const reducer = (
  state: IsPerformanceTabSupportedState = null,
  action: RootAction
): IsPerformanceTabSupportedState => {
  if (action.type === SET_IS_PERFORMANCE_TAB_SUPPORTED) {
    return action.isSupported;
  }
  return state;
};

export default reducer;
