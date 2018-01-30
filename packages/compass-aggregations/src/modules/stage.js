import parser from 'mongodb-query-parser';

/**
 * Generates an Object representing the stage to be passed to the DataService.
 *
 * @param {Object} state - The state of the stage.
 *
 * @returns {Object} The stage as an object.
 */
export default function generateStage(state) {
  if (!state.isEnabled || !state.stageOperator || !state.stage) {
    return {};
  }
  // TODO: COMPASS-2497 - Create Stage Validator Module. Could use parser.isFilterValid/etc.
  const stage = {};
  stage[state.stageOperator] = parser(state.stage);
  return stage;
}
