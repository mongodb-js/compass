/**
 * Handled in the root reducer. 
 */
export const PROJECTIONS_CHANGED =
  'aggregations/projections/PROJECTIONS_CHANGED';

export const INITIAL_STATE = [];

export default function reducer(state = INITIAL_STATE) {
  return state;
}

export const projectionsChanged = () => ({
  type: PROJECTIONS_CHANGED
});
