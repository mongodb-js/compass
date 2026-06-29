import type { AnyAction } from 'redux';
import type { PipelineBuilderThunkAction } from '.';
import { getPipelineFromBuilderState } from './pipeline-builder/builder-helpers';
import { isAction } from '../utils/is-action';

export type ExplainMode = 'visual-tree' | 'raw-output' | 'interpret';

export const explainAggregation = (
  mode: ExplainMode
): PipelineBuilderThunkAction<void> => {
  return (_dispatch, getState, { pipelineBuilder, localAppRegistry }) => {
    const pipeline = getPipelineFromBuilderState(getState(), pipelineBuilder);
    const {
      collationString: { value: collation },
      maxTimeMS,
    } = getState();
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

export const explainAggregationVisualTree =
  (): PipelineBuilderThunkAction<void> => explainAggregation('visual-tree');

export const explainAggregationRawOutput =
  (): PipelineBuilderThunkAction<void> => explainAggregation('raw-output');

export const explainAggregationInterpret =
  (): PipelineBuilderThunkAction<void> => explainAggregation('interpret');

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
