const PREFIX = 'agreggations/restore-pipeline';

/**
 * constant for restoring previous state
 */
export const RESTORE_PIPELINE_VIEW_TOGGLE = `${PREFIX}/VIEW_TOGGLE`;

export default function reducer(state, action) {
  if (action.type === RESTORE_PIPELINE_VIEW_TOGGLE) {
    return { ...state, isRestoreVisible: !!action.index };
  }
  return state;
}
