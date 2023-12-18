import type { RootAction } from '.';

export const TOGGLE = 'sidebar/TOGGLE' as const;
interface ToggleAction {
  type: typeof TOGGLE;
}
export const SET_EXPANDED = 'sidebar/SET_EXPANDED' as const;
interface SetExpandedAction {
  type: typeof SET_EXPANDED;
  isExpanded: boolean;
}
export type IsExpandedAction = ToggleAction | SetExpandedAction;
export type IsExpandedState = boolean;

export const INITIAL_STATE: IsExpandedState = true;

export default function reducer(
  state: IsExpandedState = INITIAL_STATE,
  action: RootAction
): IsExpandedState {
  if (action.type === TOGGLE) {
    return !state;
  }
  if (action.type === SET_EXPANDED) {
    return action.isExpanded;
  }
  return state;
}

export const toggleSidebar = (): ToggleAction => ({
  type: TOGGLE,
});

export const setIsExpanded = (isExpanded: boolean): SetExpandedAction => ({
  type: SET_EXPANDED,
  isExpanded,
});
