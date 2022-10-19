import mongodbQueryParser from 'mongodb-query-parser';
import decomment from 'decomment';
import toNS from 'mongodb-ns';

export const PARSE_ERROR = 'Stage must be a properly formatted document.';

function parse(...args) {
  const parsed = mongodbQueryParser(...args);

  // mongodbQueryParser will either throw or return an empty string if input is
  // not a valid query
  if (parsed === '') {
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

  if (isEmptyishStage(state)) {
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
 * @param {import('./pipeline').StageState} stage - The stage.
 */
export function validateStage(stage) {
  try {
    parse(decomment(stage.stage));
    return { isValid: true, syntaxError: null };
  } catch (e) {
    return { isValid: false, syntaxError: PARSE_ERROR };
  }
}

/**
 * Generates an Object representing the stage to be passed to the DataService.
 *
 * @param {Object} state - The state of the stage.
 *
 * @returns {import('mongodb').Document} The stage as an object.
 */
export function generateStage(state) {
  if (isEmptyishStage(state)) {
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
  const stage = generateStage(state);
  // This will turn function() {} into 'function() {}' for us which helps bson-transpilers later
  return mongodbQueryParser.toJSString(stage);
}

export function isEmptyishStage(stageState) {
  return (
    !stageState.isEnabled ||
    !stageState.stageOperator ||
    stageState.stage === ''
  );
}

/**
 * Extracts destination collection from $merge and $out operators
 *
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/merge/#syntax}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/out/#syntax}
 *
 * @param {string} namespace
 * @param {unknown} stage
 * @returns {string}
 */
export function getDestinationNamespaceFromStage(namespace, stage) {
  const stageOperator = Object.keys(stage)[0];
  const stageValue = stage[stageOperator];
  const { database } = toNS(namespace);
  if (stageOperator === '$merge') {
    const ns = typeof stage === 'string' ? stageValue : stageValue.into;
    return typeof ns === 'object' ? `${ns.db}.${ns.coll}` : `${database}.${ns}`;
  }
  if (stageOperator === '$out') {
    if (stageValue.s3) {
      // TODO: Not handled currently and we need some time to figure out how to
      // handle it so just skipping for now
      return null;
    }
    const ns = stageValue;
    return typeof ns === 'object' ? `${ns.db}.${ns.coll}` : `${database}.${ns}`;
  }
  return null;
}
