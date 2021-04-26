export const SET_VIEW_PIPELINE = 'aggregations/create-view/pipeline/SET';

export const INITIAL_STATE = [];

export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === SET_VIEW_PIPELINE) {
    return action.pipeline;
  }
  return state;
}

/**
 * The set pipeline action creator.
 *
 * @param {Array} pipeline - The view's pipeline.
 *
 * @returns {Object} The action.
 */
export const setViewPipeline = (pipeline) => ({
  type: SET_VIEW_PIPELINE,
  pipeline: pipeline
});
