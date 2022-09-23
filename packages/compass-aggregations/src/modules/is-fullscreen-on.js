/**
 * Toggle fullscreen action.
 */
export const TOGGLE_FULLSCREEN = 'aggregations/is-fullscreen-on/TOGGLE_FULLSCREEN';

/**
 * The initial state.
 */
export const INITIAL_STATE = false;

/**
 * This reducer only returns the initial state when combineReducers is
 * called - otherwise the root reducer will handle the TOGGLE_FULLSCREEN
 * actions.
 *
 * @param {Boolean} state The fullscreen state.
 * @param {Object} action The action.
 *
 * @returns {Boolean} The state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === TOGGLE_FULLSCREEN) {
    return !state;
  }
  return state;
}

/**
 * Action creator for toggle fullscreen events.
 *
 * @returns {Object} The toggle fullscreen action.
 */
export const toggleFullscreen = () => ({
  type: TOGGLE_FULLSCREEN
});


export const stageValueChanged = (stageId, newValue) => {
  return async (dispatch, _getState, /* extra arg */ { pipelineBuilder }) => {
    pipelineBuilder.updateStageValue(stageId, newValue);
    dispatch({
      type: 'STAGE_VALUE_CHANGED',
      id: stageId,
      stage: pipelineBuilder.stages[stageId].toJSON()
    });
    try {
      const previewResults = await pipelineBuilder.updatePreviewForStage(stageId);
      dispatch({
        type: 'PREVIEW_UPDATED',
        id: stageId,
        preview: previewResults
      });
    } catch (err) {
      if (err.isCanceled) {
        return;
      }
      dispatch({ type: 'PREVIEW_UPDATED_ERROR', error: err.message });
    }
  };
};