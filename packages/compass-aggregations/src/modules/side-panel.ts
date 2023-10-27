import type { AnyAction } from 'redux';
import { isAction } from '../utils/is-action';
import { type PipelineBuilderThunkAction } from '.';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { getPipelineFromBuilderState } from './pipeline-builder/builder-helpers';
const { track } = createLoggerAndTelemetry('COMPASS-AGGREGATIONS-UI');

enum ActionTypes {
  SidePanelToggled = 'compass-aggregations/sidePanelToggled',
}

type SidePanelToggledAction = {
  type: ActionTypes.SidePanelToggled;
};

type State = {
  isPanelOpen: boolean;
};

const INITIAL_PANEL_OPEN_LOCAL_STORAGE_KEY = 'is_aggregation_side_panel_open';

export default function reducer(
  state: State | undefined,
  action: AnyAction
): State {
  state ??= {
    isPanelOpen:
      localStorage.getItem(INITIAL_PANEL_OPEN_LOCAL_STORAGE_KEY) === 'false'
        ? false
        : true,
  };

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

    localStorage.setItem(
      INITIAL_PANEL_OPEN_LOCAL_STORAGE_KEY,
      willPanelBeOpen ? 'true' : 'false'
    );

    dispatch({
      type: ActionTypes.SidePanelToggled,
    });
  };
};
