const PREFIX = 'agreggations/restore-pipeline';

/**
 * constant for restoring previous state
 */
export const RESTORE_PIPELINE_MODAL_TOGGLE = `${PREFIX}/MODAL_TOGGLE`;

export const RESTORE_PIPELINE_OBJECT_ID = `${PREFIX}/OBJECT_ID`;

export const INITIAL_STATE = {
  isModalVisible: false,
  pipelineObjectID: ''
};

export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === RESTORE_PIPELINE_MODAL_TOGGLE) {
    return { ...state, isModalVisible: !!action.index };
  } else if (action.type === RESTORE_PIPELINE_OBJECT_ID) {
    return { ...state, pipelineObjectID: action.objectID };
  }

  return state;
}

export const restorePipelineModalToggle = (index) => ({
  type: RESTORE_PIPELINE_MODAL_TOGGLE,
  index: index
});

// store the current pipeline id we want to restore
export const restorePipelineObjectID = (objectID) => ({
  type: RESTORE_PIPELINE_OBJECT_ID,
  objectID: objectID
});
