import isString from 'lodash.isstring';
import semver from 'semver';
import { generateStage } from '../modules/stage';
import {
  STAGE_OPERATORS,
  ATLAS,
  TIME_SERIES,
  VIEW,
  COLLECTION
} from 'mongodb-ace-autocompleter';
import { ObjectId } from 'bson';

/**
 * Generate an empty stage for the pipeline.
 *
 * @returns {import('../modules/pipeline').StageState} An empty stage.
 */
 export const emptyStage = () => ({
  id: new ObjectId().toHexString(),
  stageOperator: '',
  stage: '',
  isValid: true,
  isEnabled: true,
  isExpanded: true,
  isLoading: false,
  isComplete: false,
  previewDocuments: [],
  syntaxError: null,
  error: null,
  projections: []
});

/**
 * 
 * @returns {import('../modules/pipeline').StageState} Stage with defaults
 */
export const generateStageWithDefaults = (props = {}) => {
  return {
    ...emptyStage(),
    ...props
  };
};

/**
 * Parse out a namespace from the stage.
 *
 * @param {String} currentDb - The current database.
 * @param {Object} stage - The stage.
 *
 * @returns {String} The namespace.
 */
export const parseNamespace = (currentDb, stage) => {
  const s = generateStage(stage);
  const merge = s.$merge;
  if (isString(merge)) {
    return `${currentDb}.${merge}`;
  }
  const into = merge.into;
  if (isString(into)) {
    return `${currentDb}.${into}`;
  }
  return `${into.db || currentDb}.${into.coll}`;
};

function supportsVersion(operator, serverVersion) {
  const versionWithoutPrerelease = semver.coerce(serverVersion);
  return semver.gte(versionWithoutPrerelease, operator?.version);
}

function supportsNamespace(operator, namespaceType) {
  return operator?.namespaces?.includes(namespaceType);
}

function supportsEnv(operator, env) {
  return operator?.env?.includes(env);
}

export function isAtlasOnly(operatorEnv) {
  return operatorEnv?.every(env => env === ATLAS);
}

function disallowOutputStagesOnCompassReadonly(operator) {
  if (operator?.outputStage) {
    // NOTE: this should be innocuous in Data Explorer / Web
    // and just always return `false`
    return process?.env?.HADRON_READONLY !== 'true';
  }

  return true;
}

/**
 * Filters stage operators by server version.
 *
 * @param {Object} options - Info about the server and the collection to filter agg stages.
 * @property {String} version - The current server version.
 * @property {String} env - The current env.
 * @property {boolean} isTimeSeries - The isTimeSeries flag.
 * @property {String} sourceName - The namespace on which created the view.
 *
 * @returns {Array} Stage operators supported by the current version of the server.
 */
export const filterStageOperators = ({ serverVersion, env, isTimeSeries, sourceName }) => {
  const namespaceType =
    isTimeSeries ? TIME_SERIES :

    // we identify a view looking for a source
    // namespace (sourceName) in collstats
    sourceName ? VIEW :
    COLLECTION;

  return STAGE_OPERATORS
    .filter(disallowOutputStagesOnCompassReadonly)
    .filter((op) => supportsVersion(op, serverVersion))
    .filter((op) => supportsNamespace(op, namespaceType))

    // we want to display Atlas-only stages
    // also when connected to on-prem / localhost
    // in order to improve their discoverability:
    .filter((op) => isAtlasOnly(op.env) || supportsEnv(op, env))
    .map(obj => ({ ...obj }))
};

export const mapPipelineToStages = (pipeline) => {
  return pipeline
    .map(generateStage)
    .filter((stage) => Object.keys(stage).length > 0);
};