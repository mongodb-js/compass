import decomment from 'decomment';

/**
 * Stage clipboard separator.
 */
const SEPARATOR = ', ';

/**
 * Open bracket.
 */
const OPEN = '[';

/**
 * Close bracket.
 */
const CLOSE = ']';

/**
 * Generate the text for a single stage.
 *
 * @param {Object} stage - The stage.
 *
 * @returns {String} The stage text.
 */
const generateStageText = (stage) => {
  if (stage.isEnabled && stage.stageOperator) {
    return `{ ${stage.stageOperator}: ${decomment(stage.stage)} }`;
  }
  return '';
};

/**
 * Generate the text for the aggregation pipeline.
 *
 * @param {Object} state - The state.
 *
 * @returns {String} The clipboard text.
 */
export const generateText = (state) => {
  let pipeline = `${OPEN}`;
  state.pipeline.forEach((stage, i) => {
    const text = generateStageText(stage);
    pipeline += text;
    if (i < state.pipeline.length - 1 && text !== '') {
      pipeline += SEPARATOR;
    }
  });
  return `${pipeline}${CLOSE}`;
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
      state.appRegistry.emit('open-aggregation-export-to-language', generateText(state));
    }
  };
};
