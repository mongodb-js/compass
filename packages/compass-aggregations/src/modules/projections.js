import { gatherProjections } from './stage';

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
  return state;
}

export const projectionsChanged = () => (dispatch, getState) => {
  const projections = getState().pipeline.flatMap((stage, index) => {
    return gatherProjections(stage, null).map(projection => {
      return { ...projection, index };
    });
  })
  dispatch({
    type: PROJECTIONS_CHANGED,
    projections
  })
};
