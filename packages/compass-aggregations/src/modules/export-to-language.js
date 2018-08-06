import { generatePipelineAsString } from 'modules/pipeline';

/**
 * Action creator for export to language events.
 *
 * @returns {Function} The export to language function.
 */
export const exportToLanguage = () => {
  return (dispatch, getState) => {
    const state = getState();
    if (state.appRegistry) {
      state.appRegistry.emit(
        'open-aggregation-export-to-language', generatePipelineAsString(state, state.pipeline.length)
      );
    }
  };
};
