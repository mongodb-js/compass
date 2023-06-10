import type { PipelineBuilderThunkAction } from '.';
import { getPipelineFromBuilderState } from './pipeline-builder/builder-helpers';
import { localAppRegistryEmit } from '@mongodb-js/mongodb-redux-common/app-registry';

export const explainAggregation = (): PipelineBuilderThunkAction<void> => {
  return (dispatch, getState, { pipelineBuilder }) => {
    const pipeline = getPipelineFromBuilderState(getState(), pipelineBuilder);
    const {
      collationString: { value: collation },
      maxTimeMS,
    } = getState();

    dispatch(
      localAppRegistryEmit('open-explain-plan-modal', {
        aggregation: {
          pipeline,
          collation,
          maxTimeMS,
        },
      })
    );
  };
};
