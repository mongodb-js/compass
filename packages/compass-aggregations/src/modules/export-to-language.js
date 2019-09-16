import { generatePipelineAsString } from 'modules/pipeline';
import {
  localAppRegistryEmit,
  globalAppRegistryEmit
} from 'mongodb-redux-common/app-registry';

/**
 * Action creator for export to language events.
 *
 * @returns {Function} The export to language function.
 */
export const exportToLanguage = () => {
  return (dispatch, getState) => {
    const state = getState();
    dispatch(
      localAppRegistryEmit(
        'open-aggregation-export-to-language',
        generatePipelineAsString(state, state.pipeline.length)
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
