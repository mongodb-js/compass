import parser from 'mongodb-query-parser';
import decomment from 'decomment';
import { parse } from 'mongodb-stage-validator';

/**
 * Generates an Object representing the stage to be passed to the DataService.
 *
 * @param {Object} state - The state of the stage.
 *
 * @returns {Object} The stage as an object.
 */
export default function generateStage(state) {
  if (!state.isEnabled || !state.stageOperator || state.stage === '') {
    return {};
  }
  const stage = {};
  try {
    const decommented = decomment(state.stage);
    parse(`{${state.stageOperator}: ${decommented}}`);
    stage[state.stageOperator] = parser(decommented);
  } catch (e) {
    state.syntaxError = e.message;
    state.isValid = false;
    state.previewDocuments = [];
    return {};
  }
  state.isValid = true;
  state.syntaxError = null;
  return stage;
}
