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

export const INITIAL_STATE: State = {
  isPanelOpen: false,
};

export default function reducer(
  state = INITIAL_STATE,
  action: AnyAction
): State {
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
  return async (dispatch, getState, { pipelineBuilder }) => {
    const {
      sidePanel: { isPanelOpen },
    } = getState();

    // When user is opening the panel
    if (!isPanelOpen) {
      track('Aggregation Side Panel Opened', {
        num_stages: getPipelineFromBuilderState(getState(), pipelineBuilder)
          .length,
      });
    }

    dispatch({
      type: ActionTypes.SidePanelToggled,
    });
  };
};
