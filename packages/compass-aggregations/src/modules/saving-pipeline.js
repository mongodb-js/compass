export const SAVING_PIPELINE_NAME_CHANGED = 'aggregations/saving-pipeline/NAME_CHANGED';

export const SAVING_PIPELINE_APPLY = 'aggregations/saving-pipeline/APPLY';

export const SAVING_PIPELINE_CANCEL = 'aggregations/saving-pipeline/CANCEL';

export const SAVING_PIPELINE_OPEN = 'aggregations/saving-pipeline/OPEN';

/**
 * The initial state.
 */
export const INITIAL_STATE = {
  isOpen: false,
  name: '',
  isSaveAs: false
};

/**
 * Reducer function for handle state changes to name in the save pipeline modal.
 *
 * @param {Object} state - The name state.
 * @param {Object} action - The action.
 *
 * @returns {any} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === SAVING_PIPELINE_NAME_CHANGED) {
    return {
      ...state,
      name: action.name
    };
  }

  if (action.type === SAVING_PIPELINE_OPEN) {
    return {
      ...state,
      isOpen: true,
      isSaveAs: action.isSaveAs,
      name: action.name
    };
  }

  if (action.type === SAVING_PIPELINE_CANCEL) {
    return {
      ...state,
      name: '',
      isOpen: false
    };
  }
  return state;
}

/**
 * Action creator for name changed events.
 *
 * @param {String} name - The name value.
 *
 * @returns {Object} The name changed action.
 */
export const savingPipelineNameChanged = (name) => ({
  type: SAVING_PIPELINE_NAME_CHANGED,
  name: name
});


/**
 * Action creator for apply name events handled in root reducer.
 *
 * @param {String} name - The name value.
 * @returns {Object} The apply name action.
 */
export const savingPipelineApply = () => ({
  type: SAVING_PIPELINE_APPLY
});

/**
 * Action creator for cancel events.
 * @returns {Object} The name changed action.
 */
export const savingPipelineCancel = () => ({
  type: SAVING_PIPELINE_CANCEL
});

/**
 * Action creator for cancel events.
 *
 * @param {String} [name] Default `''`
 * @param {Boolean} [isSaveAs] Default `false`
 * @returns {import("redux").AnyAction} The name changed action.
 */
export const savingPipelineOpen = ({name = '', isSaveAs = false} = {}) => {
  return {
    type: SAVING_PIPELINE_OPEN,
    isSaveAs: isSaveAs,
    name: name
  };
};
