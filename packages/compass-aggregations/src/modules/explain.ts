import type { PipelineBuilderThunkAction } from '.';
import { getPipelineFromBuilderState } from './pipeline-builder/builder-helpers';

export const explainAggregation = (): PipelineBuilderThunkAction<void> => {
  return (_dispatch, getState, { pipelineBuilder, globalAppRegistry }) => {
    const pipeline = getPipelineFromBuilderState(getState(), pipelineBuilder);
    const {
      collationString: { value: collation },
      maxTimeMS: { current: maxTimeMS },
    } = getState();

    globalAppRegistry.emit('open-explain-plan-modal', {
      aggregation: {
        pipeline,
        collation,
        maxTimeMS,
      },
    });
  };
};
