import isEmpty from 'lodash.isempty';
import { NEW_PIPELINE } from './import-pipeline';
import { generateStage } from './stage';
import { localAppRegistryEmit } from '@mongodb-js/mongodb-redux-common/app-registry';

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

  if (action.type === SAVING_PIPELINE_APPLY || action.type === NEW_PIPELINE) {
    return { ...INITIAL_STATE };
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
 * @returns {Object} The apply name action.
 */
export const savingPipelineApply = () => (dispatch, getState) => {
  const {
    name: currentName,
    savingPipeline: { name }
  } = getState();

  dispatch({
    type: SAVING_PIPELINE_APPLY,
    name: currentName === name ? `${name} (copy)` : name
  });
};

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
 * @returns {import("redux").AnyAction} The name changed action.
 */
export const savingPipelineOpen = ({name = '', isSaveAs = false} = {}) => {
  return {
    type: SAVING_PIPELINE_OPEN,
    isSaveAs: isSaveAs,
    name: name
  };
};

/**
 * Make view pipeline.
 *
 * @param {String} unfilteredPipeline - The unfilteredPipeline.
 *
 * @returns {Array} The mapped/filtered view pipeline.
 */
export const makeViewPipeline = (unfilteredPipeline) => {
  return unfilteredPipeline
    .map((p) => (p.executor || generateStage(p)))
    // generateStage can return {} under various conditions
    .filter((stage) => !isEmpty(stage));
};

/**
 * Open create view.
 *
 * @emits open-create-view {meta: {source, pipeline}}
 * @see create-view src/stores/create-view.js
 */
export const openCreateView = () => {
  return (dispatch, getState) => {
    const state = getState();
    const sourceNs = state.namespace;
    const sourcePipeline = makeViewPipeline(state.pipeline);

    const meta = {
      source: sourceNs,
      pipeline: sourcePipeline
    };

    dispatch(localAppRegistryEmit('open-create-view', meta));
  };
};
