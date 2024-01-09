import { getPipelineStringFromBuilderState } from './pipeline-builder/builder-helpers';
import type { PipelineBuilderThunkAction } from '.';

/**
 * Action creator for export to language events.
 *
 * @returns {Function} The export to language function.
 */
export const exportToLanguage = (): PipelineBuilderThunkAction<void> => {
  return (_dispatch, getState, { pipelineBuilder, localAppRegistry }) => {
    const pipeline = getPipelineStringFromBuilderState(
      getState(),
      pipelineBuilder
    );
    localAppRegistry.emit('open-aggregation-export-to-language', pipeline);
  };
};
