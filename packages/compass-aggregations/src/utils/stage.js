import semver from 'semver';
import toNS from 'mongodb-ns';
import {
  ADL,
  STAGE_OPERATORS,
  ATLAS,
  TIME_SERIES,
  VIEW,
  COLLECTION,
  OUT_STAGES,
} from '@mongodb-js/mongodb-constants';
import { parseShellBSON } from '../modules/pipeline-builder/pipeline-parser/utils';
import { STAGE_HELP_BASE_URL } from '../constants';

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
  return operatorEnv?.every((env) => env === ATLAS);
}

function disallowOutputStagesOnCompassReadonly(operator, preferencesReadOnly) {
  if (operator?.outputStage) {
    return !preferencesReadOnly;
  }

  return true;
}

const FilteredStagesCache = new Map();

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
export const filterStageOperators = (options) => {
  const { serverVersion, env, isTimeSeries, sourceName, preferencesReadOnly } =
    options;

  const namespaceType = isTimeSeries
    ? TIME_SERIES
    : // we identify a view looking for a source
    // namespace (sourceName) in collstats
    sourceName
    ? VIEW
    : COLLECTION;

  const cacheKey = JSON.stringify({
    serverVersion,
    env,
    namespaceType,
    preferencesReadOnly,
  });

  if (FilteredStagesCache.has(cacheKey)) {
    return FilteredStagesCache.get(cacheKey);
  }

  const filteredStages = STAGE_OPERATORS.filter((op) =>
    disallowOutputStagesOnCompassReadonly(op, preferencesReadOnly)
  )
    .filter((op) => supportsVersion(op, serverVersion))
    .filter((op) => supportsNamespace(op, namespaceType))

    // we want to display Atlas-only stages
    // also when connected to on-prem / localhost
    // in order to improve their discoverability:
    .filter((op) => isAtlasOnly(op.env) || supportsEnv(op, env));

  FilteredStagesCache.set(cacheKey, filteredStages);

  return filteredStages;
};

/**
 * @param {unknown} stage
 * @returns {string | undefined}
 */
export function getStageOperator(stage) {
  return Object.keys(stage ?? {})[0];
}

/**
 * Extracts destination collection from $merge and $out operators
 *
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/merge/#syntax}
 * @see {@link https://www.mongodb.com/docs/atlas/data-federation/supported-unsupported/pipeline/merge/#syntax}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/out/#syntax}
 * @see {@link https://www.mongodb.com/docs/atlas/data-federation/supported-unsupported/pipeline/out/#syntax}
 *
 * @param {string} namespace
 * @param {import('mongodb').Document} stage
 * @returns {string}
 */
export function getDestinationNamespaceFromStage(namespace, stage) {
  if (!stage) {
    return null;
  }
  const stageOperator = getStageOperator(stage);
  const stageValue = stage[stageOperator];

  if (!stageValue) {
    return null;
  }

  if (stageOperator === '$merge') {
    return getDestinationNamespaceFromMergeStage(namespace, stageValue);
  }
  if (stageOperator === '$out') {
    return getDestinationNamespaceFromOutStage(namespace, stageValue);
  }
  return null;
}

function getDestinationNamespaceFromMergeStage(namespace, stageValue) {
  const { database } = toNS(namespace);

  const ns = typeof stageValue === 'string' ? stageValue : stageValue.into;

  if (!ns) {
    return null;
  }

  if (typeof ns === 'string') {
    return `${database}.${ns}`;
  }

  if (ns.atlas) {
    // TODO: Not handled currently and we need some time to figure out how to
    // handle it so just skipping for now
    return null;
  }

  if (ns.db && ns.coll) {
    return `${ns.db}.${ns.coll}`;
  }
  return null;
}

function getDestinationNamespaceFromOutStage(namespace, stageValue) {
  const { database } = toNS(namespace);

  if (typeof stageValue === 'string') {
    return `${database}.${stageValue}`;
  }

  if (stageValue.s3 || stageValue.atlas) {
    // TODO: Not handled currently and we need some time to figure out how to
    // handle it so just skipping for now
    return null;
  }

  if (stageValue.db && stageValue.coll) {
    return `${stageValue.db}.${stageValue.coll}`;
  }
  return null;
}

const OUT_OPERATOR_NAMES = new Set(OUT_STAGES.map((stage) => stage.value));
const ATLAS_ONLY_OPERATOR_NAMES = new Set(
  STAGE_OPERATORS.filter((stage) => isAtlasOnly(stage.env)).map(
    (stage) => stage.value
  )
);

/**
 * @param {string} stageOperator
 * @returns {boolean}
 */
export function isOutputStage(stageOperator) {
  return OUT_OPERATOR_NAMES.has(stageOperator);
}

/**
 *
 * @param {string} stageOperator
 * @returns {boolean}
 */
export function isAtlasOnlyStage(stageOperator) {
  return ATLAS_ONLY_OPERATOR_NAMES.has(stageOperator);
}

const STAGE_OPERATOS_MAP = new Map(
  STAGE_OPERATORS.map((stage) => [stage.value, stage])
);

export const getStageHelpLink = (stageOperator) => {
  if (!stageOperator) {
    return null;
  }
  return `${STAGE_HELP_BASE_URL}/${stageOperator.replace(/^\$/, '')}/`;
};

/**
 * @param {string} namespace
 * @param {string | undefined | null} stageOperator
 * @param {string | undefined | null} stageValue
 * @returns {{ description?: string, link?: string, destination?: string }}
 */
export function getStageInfo(namespace, stageOperator, stageValue) {
  const stage = STAGE_OPERATOS_MAP.get(stageOperator);
  return {
    description: stage?.description,
    link: getStageHelpLink(stageOperator),
    destination: isOutputStage(stageOperator)
      ? (() => {
          try {
            const stage = parseShellBSON(`{${stageOperator}: ${stageValue}}`);
            if (stage[stageOperator].s3) {
              return 'S3 bucket';
            }
            if (
              stage[stageOperator].atlas ||
              stage[stageOperator].into?.atlas
            ) {
              return 'Atlas cluster';
            }
            return getDestinationNamespaceFromStage(namespace, stage);
          } catch {
            return null;
          }
        })()
      : null,
  };
}

/**
 * @param {import('mongodb').Document[]} pipeline
 * @returns {string}
 */
export const getLastStageOperator = (pipeline) => {
  const lastStage = pipeline[pipeline.length - 1];
  return getStageOperator(lastStage) ?? '';
};

/**
 * @param {import('mongodb').Document[]} pipeline
 * @returns {boolean}
 */
export const isLastStageOutputStage = (pipeline) => {
  return isOutputStage(getLastStageOperator(pipeline));
};

/**
 * @param {string | null | undefined} env
 * @param {string | null | undefined} operator
 * @param {import('mongodb').MongoServerError | null | undefined} serverError
 */
export const isMissingAtlasStageSupport = (env, operator, serverError) => {
  return (
    ![ADL, ATLAS].includes(env) &&
    isAtlasOnlyStage(operator) &&
    [
      // Unrecognized pipeline stage name
      40324,
      // The full-text search stage is not enabled
      31082,
      // "Search stages are only allowed on MongoDB Atlas"
      6047400, 6047401,
    ].includes(Number(serverError?.code ?? -1))
  );
};

/**
 * Returns the atlas operator
 * @param {string[]} operators
 */
export const findAtlasOperator = (operators) => {
  return operators.find((operator) => isAtlasOnlyStage(operator));
};

export function hasSyntaxError(stage) {
  return !!stage.syntaxError && !!stage.stageOperator && !!stage.value;
}
