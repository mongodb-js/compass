/**
 * The prefix.
 */
const PREFIX = 'aggregations/is-new-pipeline-confirm';

/**
 * Set is new pipeline confirm action.
 */
export const SET_IS_NEW_PIPELINE_CONFIRM = `${PREFIX}/SET_IS_NEW_PIPELINE_CONFIRM`;

/**
 * The initial state.
 */
export const INITIAL_STATE = false;

/**
 * Reducer function for handle state changes to isNewPipelineConfirm.
 *
 * @param {Boolean} state - The isNewPipelineConfirm state.
 * @param {Object} action - The action.
 *
 * @returns {Boolean} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === SET_IS_NEW_PIPELINE_CONFIRM) {
    return action.isNewPipelineConfirm;
  }
  return state;
}

/**
 * Action creator for set isNewPipelineConfirm events.
 *
 * @param {Boolean} isNewPipelineConfirm - The isNewPipelineConfirm value.
 *
 * @returns {import("redux").AnyAction} The setIsNewPipelineConfirm action.
 */
export const setIsNewPipelineConfirm = (isNewPipelineConfirm) => ({
  type: SET_IS_NEW_PIPELINE_CONFIRM,
  isNewPipelineConfirm
});
