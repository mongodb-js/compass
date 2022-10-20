import { globalAppRegistryEmit } from '@mongodb-js/mongodb-redux-common/app-registry';
import { getStagesFromBuilderState } from './pipeline-builder/builder-helpers';
import { getDestinationNamespaceFromStage } from '../utils/stage';

/**
 * The initial state.
 */
export const INITIAL_STATE = null;

/**
 * Reducer function for handle state changes to the out results fn.
 *
 * @param {any} state - The fn state.
 * @param {Object} action - The action.
 *
 * @returns {any} The new state.
 */
export default function reducer(state = INITIAL_STATE) {
  return state;
}

/**
 * Go to the $out / $merge results collection
 */
export const gotoOutResults = (index) => {
  return (dispatch, getState, { pipelineBuilder }) => {
    const state = getState();
    const stage = getStagesFromBuilderState(state, pipelineBuilder)[index];
    const namespace = getDestinationNamespaceFromStage(state.namespace, stage);
    if (state.outResultsFn) {
      state.outResultsFn(namespace);
    } else {
      dispatch(
        globalAppRegistryEmit('aggregations-open-result-namespace', namespace)
      );
    }
  };
};
