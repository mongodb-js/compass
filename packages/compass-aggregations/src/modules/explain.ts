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

export const ExplainInterpretActionTypes = {
  Loading: 'compass-aggregations/InterpretLoading',
  Done: 'compass-aggregations/InterpretDone',
} as const;

type ExplainInterpretLoadingAction = {
  type: typeof ExplainInterpretActionTypes.Loading;
};

type ExplainInterpretDoneAction = {
  type: typeof ExplainInterpretActionTypes.Done;
};

export default function isInterpretLoading(
  state = false,
  action: AnyAction
): boolean {
  if (
    isAction<ExplainInterpretLoadingAction>(
      action,
      ExplainInterpretActionTypes.Loading
    )
  )
    return true;
  if (
    isAction<ExplainInterpretDoneAction>(
      action,
      ExplainInterpretActionTypes.Done
    )
  )
    return false;
  return state;
}
