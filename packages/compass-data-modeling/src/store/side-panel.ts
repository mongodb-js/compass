import type { Reducer } from 'redux';
import { isAction } from './util';

export type SidePanelState = {
  isOpen: boolean;
};

export enum SidePanelActionTypes {
  SIDE_PANEL_OPENED = 'data-modeling/side-panel/SIDE_PANEL_OPENED',
  SIDE_PANEL_CLOSED = 'data-modeling/side-panel/SIDE_PANEL_CLOSED',
}

export type SidePanelOpenedAction = {
  type: SidePanelActionTypes.SIDE_PANEL_OPENED;
};

export type SidePanelClosedAction = {
  type: SidePanelActionTypes.SIDE_PANEL_CLOSED;
};

export type SidePanelActions = SidePanelOpenedAction | SidePanelClosedAction;

const INITIAL_STATE: SidePanelState = {
  isOpen: false,
};

export const sidePanelReducer: Reducer<SidePanelState> = (
  state = INITIAL_STATE,
  action
) => {
  if (isAction(action, SidePanelActionTypes.SIDE_PANEL_OPENED)) {
    return {
      ...state,
      isOpen: true,
    };
  }
  if (isAction(action, SidePanelActionTypes.SIDE_PANEL_CLOSED)) {
    return {
      ...state,
      isOpen: false,
    };
  }
  return state;
};

export const openSidePanel = (): SidePanelOpenedAction => ({
  type: SidePanelActionTypes.SIDE_PANEL_OPENED,
});

export const closeSidePanel = (): SidePanelClosedAction => ({
  type: SidePanelActionTypes.SIDE_PANEL_CLOSED,
});
