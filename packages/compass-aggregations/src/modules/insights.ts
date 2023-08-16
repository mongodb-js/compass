import type { Reducer } from 'redux';
import type { Stage } from '@mongodb-js/explain-plan-helper';
import { ExplainPlan } from '@mongodb-js/explain-plan-helper';
import { getPipelineFromBuilderState } from './pipeline-builder/builder-helpers';
import { cancellableWait } from '@mongodb-js/compass-utils';
import type { PipelineBuilderThunkAction } from '.';
import { ActionTypes as ConfirmNewPipelineActions } from './is-new-pipeline-confirm';
import { RESTORE_PIPELINE } from './saved-pipeline';
import { AIPipelineActionTypes } from './pipeline-builder/pipeline-ai';

const FETCH_EXPLAIN_PLAN_SUCCESS =
  'compass-aggregations/FETCH_EXPLAIN_PLAN_SUCCESS';

const INITIAL_STATE = { isCollectionScan: false };

const reducer: Reducer<{ isCollectionScan: boolean }> = (
  state = INITIAL_STATE,
  action
) => {
  if (action.type === FETCH_EXPLAIN_PLAN_SUCCESS) {
    return {
      ...state,
      isCollectionScan: action.explainPlan.isCollectionScan,
    };
  }
  if (
    action.type === ConfirmNewPipelineActions.NewPipelineConfirmed ||
    action.type === AIPipelineActionTypes.LoadNewPipeline ||
    action.type === RESTORE_PIPELINE
  ) {
    return { ...INITIAL_STATE };
  }
  return state;
};

const ExplainFetchAbortControllerMap = new Map<string, AbortController>();

function getAbortSignal(id: string) {
  ExplainFetchAbortControllerMap.get(id)?.abort();
  const controller = new AbortController();
  ExplainFetchAbortControllerMap.set(id, controller);
  return controller.signal;
}

export const fetchExplainForPipeline = (): PipelineBuilderThunkAction<
  Promise<void>
> => {
  return async (dispatch, getState, { pipelineBuilder }) => {
    const { id, namespace, dataService, maxTimeMS } = getState();
    const abortSignal = getAbortSignal(id);
    try {
      // Debounce action to allow for user typing to stop
      await cancellableWait(300, abortSignal);
      const pipeline = getPipelineFromBuilderState(getState(), pipelineBuilder);
      const rawExplainPlan = await dataService.dataService?.explainAggregate?.(
        namespace,
        pipeline,
        { maxTimeMS: maxTimeMS ?? undefined },
        { explainVerbosity: 'queryPlanner', abortSignal }
      );
      const explainPlan = new ExplainPlan(rawExplainPlan as Stage);
      dispatch({ type: FETCH_EXPLAIN_PLAN_SUCCESS, explainPlan });
      ExplainFetchAbortControllerMap.delete(id);
    } catch (err) {
      // We are only fetching this to get information about index usage for
      // insight badge, if this fails for any reason: server, cancel, error
      // getting pipeline from state, or parsing explain plan. Whatever it is,
      // we don't care and ignore it
    }
  };
};

export const openCreateIndexModal = (): PipelineBuilderThunkAction<void> => {
  return (_dispatch, getState) => {
    const { appRegistry } = getState();
    (appRegistry as any).localAppRegistry.emit('open-create-index-modal');
  };
};

export default reducer;
