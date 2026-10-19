import { isAction } from '../utils/is-action';
import { type PipelineBuilderThunkAction } from '.';
import { getPipelineFromBuilderState } from './pipeline-builder/builder-helpers';
import type { AnyAction } from 'redux';

const ActionTypes = {
  SidePanelToggled: 'compass-aggregations/sidePanelToggled',
} as const;

type SidePanelToggledAction = {
  type: typeof ActionTypes.SidePanelToggled;
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
  Promise<void>,
  SidePanelToggledAction
> => {
  return async (
    dispatch,
    getState,
    { pipelineBuilder, track, connectionInfoRef }
  ) => {
    const {
      sidePanel: { isPanelOpen },
    } = getState();

    const willPanelBeOpen = !isPanelOpen;

    // When user is opening the panel
    if (willPanelBeOpen) {
      try {
        const num_stages = (
          await getPipelineFromBuilderState(getState(), pipelineBuilder)
        ).length;
        track(
          'Aggregation Side Panel Opened',
          { num_stages },
          connectionInfoRef.current
        );
      } catch {
        // Pipeline with syntax errors, nothing to count
      }
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
