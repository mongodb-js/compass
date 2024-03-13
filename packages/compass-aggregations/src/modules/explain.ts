import type { PipelineBuilderThunkAction } from '.';
import { getPipelineFromBuilderState } from './pipeline-builder/builder-helpers';

export const explainAggregation = (): PipelineBuilderThunkAction<void> => {
  return (_dispatch, getState, { pipelineBuilder, localAppRegistry }) => {
    const pipeline = getPipelineFromBuilderState(getState(), pipelineBuilder);
    const {
      collationString: { value: collation },
      maxTimeMS,
    } = getState();

    localAppRegistry.emit('open-explain-plan-modal', {
      aggregation: {
        pipeline,
        collation,
        maxTimeMS,
      },
    });
  };
};
