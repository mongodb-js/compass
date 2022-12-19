// TODO: remove this completely
import { ActionTypes as ConfirmNewPipelineActions } from './is-new-pipeline-confirm';

/**
 * Handled in the root reducer.
 */
export const PROJECTIONS_CHANGED =
  'aggregations/projections/PROJECTIONS_CHANGED';

export const INITIAL_STATE = [];

export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === PROJECTIONS_CHANGED) {
    return action.projections;
  }
  if (action.type === ConfirmNewPipelineActions.NewPipelineConfirmed) {
    return INITIAL_STATE;
  }
  return state;
}
