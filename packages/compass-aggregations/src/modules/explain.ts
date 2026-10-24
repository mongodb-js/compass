import type { AnyAction } from 'redux';
import type { PipelineBuilderThunkAction } from '.';
import { getPipelineFromBuilderState } from './pipeline-builder/builder-helpers';
import { isAction } from '../utils/is-action';
import { getCollationForExecution } from './collation-string';

export type ExplainMode = 'visual-tree' | 'raw-output' | 'interpret';

export const explainAggregation = (
  mode: ExplainMode
): PipelineBuilderThunkAction<Promise<void>> => {
  return async (_dispatch, getState, { pipelineBuilder, localAppRegistry }) => {
    const pipeline = await getPipelineFromBuilderState(
      getState(),
      pipelineBuilder
    );
    const { collationString, maxTimeMS } = getState();
    const collation = await getCollationForExecution(collationString);
    const payload = { aggregation: { pipeline, collation, maxTimeMS } };

    if (mode === 'interpret') {
      localAppRegistry.emit('open-explain-plan-for-interpret', payload);
      return;
    }

    localAppRegistry.emit('open-explain-plan-modal', {
      ...payload,
      ...(mode === 'raw-output' ? { initialViewType: 'json' as const } : {}),
    });
  };
};

export const explainAggregationVisualTree = (): PipelineBuilderThunkAction<
  Promise<void>
> => explainAggregation('visual-tree');

export const explainAggregationRawOutput = (): PipelineBuilderThunkAction<
  Promise<void>
> => explainAggregation('raw-output');

export const explainAggregationInterpret = (): PipelineBuilderThunkAction<
  Promise<void>
> => explainAggregation('interpret');

const ExplainInterpretActionTypes = {
  Started: 'compass-aggregations/InterpretStarted',
  Finished: 'compass-aggregations/InterpretFinished',
} as const;

type ExplainInterpretStartedAction = {
  type: typeof ExplainInterpretActionTypes.Started;
};

type ExplainInterpretFinishedAction = {
  type: typeof ExplainInterpretActionTypes.Finished;
};

export type ExplainState = { isLoading: boolean };

export const interpretExplainStarted = (): ExplainInterpretStartedAction => ({
  type: ExplainInterpretActionTypes.Started,
});

export const interpretExplainFinished = (): ExplainInterpretFinishedAction => ({
  type: ExplainInterpretActionTypes.Finished,
});

export default function explainReducer(
  state: ExplainState = { isLoading: false },
  action: AnyAction
): ExplainState {
  if (
    isAction<ExplainInterpretStartedAction>(
      action,
      ExplainInterpretActionTypes.Started
    )
  ) {
    return { isLoading: true };
  }
  if (
    isAction<ExplainInterpretFinishedAction>(
      action,
      ExplainInterpretActionTypes.Finished
    )
  ) {
    return { isLoading: false };
  }
  return state;
}
