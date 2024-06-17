import { isAction } from '../utils/is-action';
import { type PipelineBuilderThunkAction } from '.';
import { getPipelineFromBuilderState } from './pipeline-builder/builder-helpers';
import type { AnyAction } from 'redux';
import { createTrack } from '@mongodb-js/compass-telemetry';

const track = createTrack();

enum ActionTypes {
  SidePanelToggled = 'compass-aggregations/sidePanelToggled',
}

type SidePanelToggledAction = {
  type: ActionTypes.SidePanelToggled;
};
export type SidePanelAction = SidePanelToggledAction;

export type SidePanelState = {
  isPanelOpen: boolean;
};

export const INITIAL_PANEL_OPEN_LOCAL_STORAGE_KEY =
  'is_aggregation_side_panel_open' as const;

export default function reducer(
  state: SidePanelState = { isPanelOpen: false },
  action: AnyAction
): SidePanelState {
  if (isAction<SidePanelToggledAction>(action, ActionTypes.SidePanelToggled)) {
    return {
      ...state,
      isPanelOpen: !state.isPanelOpen,
    };
  }

  return state;
}

export const toggleSidePanel = (): PipelineBuilderThunkAction<
  void,
  SidePanelToggledAction
> => {
  return (dispatch, getState, { pipelineBuilder }) => {
    const {
      sidePanel: { isPanelOpen },
    } = getState();

    const willPanelBeOpen = !isPanelOpen;

    // When user is opening the panel
    if (willPanelBeOpen) {
      track('Aggregation Side Panel Opened', {
        num_stages: getPipelineFromBuilderState(getState(), pipelineBuilder)
          .length,
      });
    }

    // Persist the state of the stage wizard side panel for other tabs or for
    // the next application start
    localStorage.setItem(
      INITIAL_PANEL_OPEN_LOCAL_STORAGE_KEY,
      willPanelBeOpen ? 'true' : 'false'
    );

    dispatch({
      type: ActionTypes.SidePanelToggled,
    });
  };
};
