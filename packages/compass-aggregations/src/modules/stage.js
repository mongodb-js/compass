import parser from 'mongodb-query-parser';
import decomment from 'decomment';

const PARSE_ERROR = 'Stage must be a properly formatted document.';

/**
 * Looks for projections the stage could produce that
 * subsequent pipeline stages implicitly know about
 * in the server.
 *
 * @param {Object} state The state of the stage.
 * @param {Object} stage The validated stage object.
 * @returns {Array}
 */
export function gatherProjections(state, stage) {
  /**
   * Now that its been validated, detect any projections
   * and bubble them up to `state`.
   */
  const projections = [];
  if (state.stageOperator !== '$project') {
    return projections;
  }

  if (!state.isEnabled || !state.stageOperator || state.stage === '') {
    return projections;
  }

  if (!stage) {
    stage = {};
    try {
      const decommented = decomment(state.stage);
      stage[state.stageOperator] = parser(decommented);
    } catch (e) {
      return projections;
    }
  }

  const stageContents = stage[state.stageOperator];
  Object.keys(stageContents).map((k) => {
    const projection = stageContents[k];
    /**
     * If the projection is truthy, add it to the list.
     */
    if (projection) {
      projections.push({
        name: k,
        value: k,
        score: 1,
        meta: JSON.stringify(projection),
        version: '0.0.0'
      });
    }
  });
  return projections;
}

/**
 * Generates an Object representing the stage to be passed to the DataService.
 *
 * @param {Object} state - The state of the stage.
 *
 * @returns {Object} The stage as an object.
 */
export function generateStage(state) {
  if (!state.isEnabled || !state.stageOperator || state.stage === '') {
    return {};
  }
  const stage = {};
  try {
    const decommented = decomment(state.stage);
    stage[state.stageOperator] = parser(decommented);
  } catch (e) {
    state.syntaxError = PARSE_ERROR;
    state.isValid = false;
    state.previewDocuments = [];
    return {};
  }

  state.projections = gatherProjections(state, stage);
  state.isValid = true;
  state.syntaxError = null;
  return stage;
}

export function generateStageAsString(state) {
  if (!state.isEnabled || !state.stageOperator || state.stage === '') {
    return '{}';
  }
  let stage;
  try {
    const decommented = decomment(state.stage);
    stage = `{${state.stageOperator}: ${decommented}}`;
    parser(decommented); // Run the parser so we can error check
  } catch (e) {
    state.syntaxError = PARSE_ERROR;
    state.isValid = false;
    state.previewDocuments = [];
    return '{}';
  }

  state.isValid = true;
  state.syntaxError = null;
  return stage;
}
