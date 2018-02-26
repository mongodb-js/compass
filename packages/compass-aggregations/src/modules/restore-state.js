const PREFIX = 'agreggations/restore-pipeline';

/**
 * constant for restoring previous state
 */
export const RESTORE_PIPELINE_VIEW_TOGGLE = `${PREFIX}/VIEW_TOGGLE`;

export const INITIAL_STATE = {
  isRestoreVisible: false
};

export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === RESTORE_PIPELINE_VIEW_TOGGLE) {
    return { ...state, isRestoreVisible: action.index };
  }

  return state;
}

export const restorePipelineViewToggle = (index) => ({
  type: RESTORE_PIPELINE_VIEW_TOGGLE,
  index: index
});
