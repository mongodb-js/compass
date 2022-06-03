import isString from 'lodash.isstring';
import semver from 'semver';

import { generateStage } from '../modules/stage';
import { emptyStage } from '../modules/pipeline';
import { STAGE_OPERATORS, ATLAS } from 'mongodb-ace-autocompleter';

const SEARCH = '$search';
const SEARCH_META = '$searchMeta';
const DOCUMENTS = '$documents';

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

/**
 * Does this list of environments indicate Atlas-Cluster-only support?
 *
 * @param {Array} operatorEnv - The operation-supported environments.
 *
 * @returns {boolean} If the env is atlas-only.
 */
export const isAtlasOnly = (operatorEnv) => {
  if (!operatorEnv) return false;
  return operatorEnv.every(env => env === ATLAS);
};

/**
 * Is the env supported?
 *
 * @param {Object} options - The stage supported env and the server env to compare.
 * @property {Array} operatorEnv - The operation-supported environments.
 * @property {String} env - The current env.
 *
 * @returns {boolean} If the env is supported.
 */
const isSupportedEnv = ({ operatorEnv, env }) => {
  if (!operatorEnv || !env) return true;
  return operatorEnv.includes(env);
};

/**
 * Is the stage supported by the server?
 *
 * @param {Object} options - The stage min supported version and the server version to compare.
 * @property {Number} operatorVersion - The min version of the server that the stage supports.
 * @property {Number} version - The current server version.
 *
 * @returns {boolean} If the stage is supported by the server.
 */
const isSupportedVersion = ({ operatorVersion, version }) => semver.gte(version, operatorVersion);

/**
 * Is search on a view, time-series, or regular collection?
 *
 * @param {Object} options - The options to exclude the full-text search stages on views.
 * @property {String} operatorName - The stage name.
 * @property {Boolean} isTimeSeries - The isTimeSeries flag.
 * @property {Boolean} isReadonly - The isReadonly flag.
 * @property {String} sourceName - The namespace on which created the view.
 *
 * @returns {boolean} If search on a view, time-series, or regular collection.
 */
const isSearchOnView = ({ operatorName, isTimeSeries, isReadonly, sourceName }) =>
  [SEARCH, SEARCH_META, DOCUMENTS].includes(operatorName) &&
  (isTimeSeries || (isReadonly && !!sourceName));

/**
 * Filters stage operators by server version.
 *
 * @param {Object} options - Info about the server and the collection to filter agg stages.
 * @property {String} version - The current server version.
 * @property {String} env - The current env.
 * @property {boolean} isTimeSeries - The isTimeSeries flag.
 * @property {boolean} isReadonly - The isReadonly flag.
 * @property {String} sourceName - The namespace on which created the view.
 *
 * @returns {Array} Stage operators supported by the current version of the server.
 */
export const filterStageOperators = ({ serverVersion, env, isTimeSeries, isReadonly, sourceName }) => {
  const parsedVersion = semver.parse(serverVersion);
  const cleanVersion = parsedVersion
    ? [parsedVersion.major, parsedVersion.minor, parsedVersion.patch].join('.')
    : serverVersion;

  return STAGE_OPERATORS.filter((operator) => {
    console.log(JSON.stringify(operator));
    if (isSearchOnView({
      operatorName: operator.name,
      isTimeSeries,
      isReadonly,
      sourceName
    })) return false;
    if (operator.dbOnly) return false;

    return isSupportedVersion({ operatorVersion: operator.version, version: cleanVersion }) &&
      isSupportedEnv({ operatorEnv: operator.env, env }) ||
      isAtlasOnly(operator.env);
  });
};
