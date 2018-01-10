/**
 * Input type.
 */
const TYPE = 'text';

/**
 * Styles attribute.
 */
const STYLES = 'styles';

/**
 * Input display.
 */
const DISPLAY = 'display: none;';

/**
 * Input type.
 */
const INPUT = 'input';

/**
 * Copy command.
 */
const COPY = 'copy';

/**
 * Stage clipboard separator.
 */
const SEPARATOR = ', ';

/**
 * Generate the text for a single stage.
 *
 * @param {Object} stage - The stage.
 *
 * @returns {String} The stage text.
 */
const generateStageText = (stage) => {
  if (stage.isEnabled && stage.stageOperator) {
    return `{ ${stage.stageOperator}: ${stage.stage} }`;
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
export const generateClipboardText = (state) => {
  let pipeline = '';
  state.stages.forEach((stage, i) => {
    pipeline += generateStageText(stage);
    if (i < state.stages.length - 1) {
      pipeline += SEPARATOR;
    }
  });
  return pipeline;
};

/**
 * Execute the copy to the clipboard.
 *
 * @param {Object} state - The state.
 *
 * @returns {Object} The result of the copy.
 */
const executeCopy = (state) => {
  const input = document.createElement(INPUT);
  input.type = TYPE;
  input.setAttribute(STYLES, DISPLAY);
  input.value = generateClipboardText(state);
  document.body.appendChild(input);
  input.select();
  return document.execCommand(COPY);
};

/**
 * Action creator for copy to clipboard events.
 *
 * @returns {Function} The copy to clipboard function.
 */
export const copyToClipboard = () => {
  return (dispatch, getState) => {
    executeCopy(getState());
  };
};
