import { globalAppRegistryEmit } from '@mongodb-js/mongodb-redux-common/app-registry';
import { getStagesFromBuilderState } from './pipeline-builder/builder-helpers';
import { getDestinationNamespaceFromStage } from '../utils/stage';
import { disableFocusMode } from './focus-mode';
import type { PipelineBuilderThunkAction } from '.';

export type OutResultsFnState = null | ((namespace: string) => void);

/**
 * The initial state.
 */
export const INITIAL_STATE: OutResultsFnState = null;

/**
 * Reducer function for handle state changes to the out results fn.
 */
export default function reducer(
  state: OutResultsFnState = INITIAL_STATE
): OutResultsFnState {
  return state;
}

/**
 * Go to the $out / $merge results collection
 */
export const gotoOutResults = (
  index: number
): PipelineBuilderThunkAction<void> => {
  return (dispatch, getState, { pipelineBuilder }) => {
    const state = getState();
    const stage = getStagesFromBuilderState(state, pipelineBuilder)[index];
    const namespace = getDestinationNamespaceFromStage(state.namespace, stage);
    if (state.outResultsFn) {
      state.outResultsFn(namespace!);
    } else {
      dispatch(
        globalAppRegistryEmit('aggregations-open-result-namespace', namespace)
      );
    }
  };
};

export const viewOutResults = (
  index: number
): PipelineBuilderThunkAction<void> => {
  return (dispatch, getState) => {
    if (getState().focusMode.isEnabled) {
      dispatch(disableFocusMode());
    }
    dispatch(gotoOutResults(index));
  };
};
