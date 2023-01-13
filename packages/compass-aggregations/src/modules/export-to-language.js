import {
  localAppRegistryEmit,
  globalAppRegistryEmit
} from '@mongodb-js/mongodb-redux-common/app-registry';
import { getPipelineStringFromBuilderState } from './pipeline-builder/builder-helpers';

/**
 * Action creator for export to language events.
 *
 * @returns {Function} The export to language function.
 */
export const exportToLanguage = () => {
  return (dispatch, getState, { pipelineBuilder }) => {
    const pipeline = getPipelineStringFromBuilderState(
      getState(),
      pipelineBuilder
    );
    dispatch(
      localAppRegistryEmit(
        'open-aggregation-export-to-language',
        pipeline
      )
    );
    dispatch(
      globalAppRegistryEmit(
        'compass:export-to-language:opened',
        { source: 'Aggregations' }
      )
    );
  };
};
