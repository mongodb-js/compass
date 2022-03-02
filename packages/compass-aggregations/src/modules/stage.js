import mongodbQueryParser from 'mongodb-query-parser';
import decomment from 'decomment';

const PARSE_ERROR = 'Stage must be a properly formatted document.';

function parse(...args) {
  const parsed = mongodbQueryParser(...args);

  if (!parsed) {
    throw new Error(PARSE_ERROR);
  }

  return parsed;
}

/**
 * Looks for projections the stage could produce that
 * subsequent pipeline stages implicitly know about
 * in the server.
 *
 * @param {Object} state The state of the stage.
 * @param {Object | null} stage The validated stage object.
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
      stage[state.stageOperator] = parse(decommented);
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
    stage[state.stageOperator] = parse(decommented);
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

  const decommented = decomment(state.stage);

  let parsed;

  // Run the parse so we can error check
  try {
    parsed = parse(decommented);
  } catch (e) {
    state.syntaxError = PARSE_ERROR;
    state.isValid = false;
    state.previewDocuments = [];
    return '{}';
  }

  state.isValid = true;
  state.syntaxError = null;

  // This will turn function() {} into 'function() {}' for us which helps bson-transpilers later
  const jsString = mongodbQueryParser.toJSString(parsed);
  return `{${state.stageOperator}: ${jsString}}`;
}
