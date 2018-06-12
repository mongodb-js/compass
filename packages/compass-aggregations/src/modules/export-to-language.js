/**
 * Generate the pipeline for export to language.
 *
 * @param {Object} state - The state.
 *
 * @returns {Array} The raw pipeline.
 */
export const generatePipeline = (state) => {
  const pipeline = [];
  state.pipeline.forEach((stage) => {
    if (stage.isEnabled && stage.stageOperator) {
      pipeline.push(stage.executor);
    }
  });
  console.log(pipeline);
  return pipeline;
};

/**
 * Action creator for export to language events.
 *
 * @returns {Function} The export to language function.
 */
export const exportToLanguage = () => {
  return (dispatch, getState) => {
    const state = getState();
    if (state.appRegistry) {
      state.appRegistry.emit('open-aggregation-export-to-language', generatePipeline(state));
    }
  };
};
