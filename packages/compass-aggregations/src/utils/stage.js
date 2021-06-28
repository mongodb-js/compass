import isString from 'lodash.isstring';
import semver from 'semver';

import { generateStage } from '../modules/stage';
import { emptyStage } from '../modules/pipeline';
import { STAGE_OPERATORS } from 'mongodb-ace-autocompleter';

const OUT = '$out';
const MERGE = '$merge';

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
 * @param {String} stage - The stage.
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
 * Is the env supported?
 *
 * @param {Array} opEnvs - The operation supported environments.
 * @param {String} env - The current env.
 *
 * @returns {boolean} If the env is supported.
 */
const isSupportedEnv = (opEnvs, env) => {
  if (!opEnvs || !env) return true;
  return opEnvs.includes(env);
};

/**
 * Filters stage operators by server version.
 *
 * @param {String} version - The current server version.
 * @param {boolean} allowWrites - If writes are allowed.
 * @param {String} env - The current env.
 *
 * @returns {Array} Stage operators supported by the current version of the server.
 */
export const filterStageOperators = (version, allowWrites, env) => {
  const parsedVersion = semver.parse(version);
  const cleanVersion = parsedVersion
    ? [parsedVersion.major, parsedVersion.minor, parsedVersion.patch].join('.')
    : version;

  return STAGE_OPERATORS.filter((o) => {
    if ((o.name === OUT || o.name === MERGE) && !allowWrites) return false;
    return semver.gte(cleanVersion, o.version) && isSupportedEnv(o.env, env);
  });
};
