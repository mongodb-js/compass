import type { AnyAction } from 'redux';

export const TOGGLE = 'sidebar/TOGGLE';
export const SET_EXPANDED = 'sidebar/SET_EXPANDED';

export const INITIAL_STATE = true;

export default function reducer(state = INITIAL_STATE, action: AnyAction) {
  if (action.type === TOGGLE) {
    return !state;
  }
  if (action.type === SET_EXPANDED) {
    return action.isExpanded;
  }
  return state;
}

export const toggleSidebar = () => ({
  type: TOGGLE,
});

export const setIsExpanded = (isExpanded: boolean) => ({
  type: SET_EXPANDED,
  isExpanded,
});
