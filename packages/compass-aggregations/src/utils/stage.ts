import toNS from 'mongodb-ns';
import {
  ADL,
  ATLAS,
  ON_PREM,
  STAGE_OPERATORS,
  OUT_STAGES,
  TIME_SERIES,
  VIEW,
  COLLECTION,
  getFilteredCompletions,
} from '@mongodb-js/mongodb-constants';
import { parseShellBSON } from '../modules/pipeline-builder/pipeline-parser/utils';
import { STAGE_HELP_BASE_URL } from '../constants';
import type { StoreStage } from '../modules/pipeline-builder/stage-editor';
import type { ServerEnvironment } from '../modules/env';
import type { Document, MongoServerError } from 'mongodb';

export function isAtlasOnly(operatorEnv: readonly ServerEnvironment[]) {
  return operatorEnv?.every((env) => env === ATLAS);
}

function disallowOutputStagesOnCompassReadonly(
  operator: ReturnType<typeof getFilteredCompletions>[number],
  preferencesReadOnly: boolean
): boolean {
  if (operator?.outputStage) {
    return !preferencesReadOnly;
  }

  return true;
}

const FilteredStagesCache = new Map();

// XXX: `name` is actually already part of the return type, getFilteredCompletions is just under-typed
export type FilteredStageOperators = (ReturnType<
  typeof getFilteredCompletions
>[number] & { name: string; env: ServerEnvironment[]; description: string })[];

/**
 * Filters stage operators by server version.
 */
export const filterStageOperators = ({
  serverVersion,
  env,
  isTimeSeries,
  sourceName,
  preferencesReadOnly,
}: {
  serverVersion: string;
  env: ServerEnvironment;
  isTimeSeries: boolean;
  sourceName: string | null;
  preferencesReadOnly: boolean;
}): FilteredStageOperators => {
  const namespaceType = isTimeSeries
    ? TIME_SERIES
    : // we identify a view looking for a source namespace (sourceName) in stats
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

  const filteredStages = getFilteredCompletions({
    serverVersion,
    meta: ['stage'],
    stage: {
      namespace: namespaceType,
      env:
        env === ON_PREM
          ? // we want to display Atlas-only stages
            // also when connected to on-prem / localhost
            // in order to improve their discoverability:
            [env, ATLAS]
          : env,
    },
  }).filter((op) => {
    return disallowOutputStagesOnCompassReadonly(op, preferencesReadOnly);
  });

  FilteredStagesCache.set(cacheKey, filteredStages);

  return filteredStages as FilteredStageOperators;
};

export function getStageOperator(
  stage: Record<string, unknown> | undefined | null
): string | undefined {
  return Object.keys(stage ?? {})[0];
}

/**
 * Extracts destination collection from $merge and $out operators
 *
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/merge/#syntax}
 * @see {@link https://www.mongodb.com/docs/atlas/data-federation/supported-unsupported/pipeline/merge/#syntax}
 * @see {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/out/#syntax}
 * @see {@link https://www.mongodb.com/docs/atlas/data-federation/supported-unsupported/pipeline/out/#syntax}
 */
export function getDestinationNamespaceFromStage(
  namespace: string,
  stage: Record<string, unknown> | null
): string | null {
  if (!stage) {
    return null;
  }
  const stageOperator = getStageOperator(stage);
  const stageValue = stageOperator && stage[stageOperator];

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

function getDestinationNamespaceFromMergeStage(
  namespace: string,
  stageValue: any
) {
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

function getDestinationNamespaceFromOutStage(
  namespace: string,
  stageValue: any
) {
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

const OUT_OPERATOR_NAMES: ReadonlySet<string> = new Set(
  OUT_STAGES.map((stage) => stage.value)
);

const ATLAS_ONLY_OPERATOR_NAMES: ReadonlySet<string> = new Set(
  STAGE_OPERATORS.filter((stage) => isAtlasOnly(stage.env)).map(
    (stage) => stage.value
  )
);

export function isOutputStage(
  stageOperator: string | null | undefined
): boolean {
  return !!stageOperator && OUT_OPERATOR_NAMES.has(stageOperator);
}

export function isAtlasOnlyStage(
  stageOperator: string | null | undefined
): boolean {
  return !!stageOperator && ATLAS_ONLY_OPERATOR_NAMES.has(stageOperator);
}

/*
Atlas Search does not return an error if there is no search index - it just
returns no results. So if the connection has access to Atlas Search and the
aggregation used a search-related stage and got no results we want to display a
different error.
*/
export function isSearchStage(
  stageOperator: string | null | undefined
): stageOperator is '$search' | '$searchMeta' | '$vectorSearch' {
  if (!stageOperator) {
    return false;
  }
  return ['$search', '$searchMeta', '$vectorSearch'].includes(stageOperator);
}

const STAGE_OPERATORS_MAP = new Map(
  STAGE_OPERATORS.map((stage) => [stage.value, stage])
);

export const getStageHelpLink = (
  stageOperator: string | null | undefined
): string | null => {
  if (!stageOperator) {
    return null;
  }
  return `${STAGE_HELP_BASE_URL}/${stageOperator.replace(/^\$/, '')}/`;
};

export function getStageInfo(
  namespace: string,
  stageOperator: string | null,
  stageValue: string | undefined | null
): { description?: string; link: string | null; destination: string | null } {
  const stage = STAGE_OPERATORS_MAP.get(stageOperator as any);
  return {
    description: stage?.description,
    link: getStageHelpLink(stageOperator),
    destination:
      stageOperator && isOutputStage(stageOperator)
        ? (() => {
            try {
              const stage = parseShellBSON<Document>(
                `{${stageOperator}: ${stageValue}}`
              );
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
export const getLastStageOperator = (pipeline: Record<string, unknown>[]) => {
  const lastStage = pipeline[pipeline.length - 1];
  return getStageOperator(lastStage) ?? '';
};

/**
 * @param {import('mongodb').Document[]} pipeline
 * @returns {boolean}
 */
export const isLastStageOutputStage = (pipeline: Record<string, unknown>[]) => {
  return isOutputStage(getLastStageOperator(pipeline));
};

export const isMissingAtlasStageSupport = (
  env: ServerEnvironment,
  operator: string | null | undefined,
  serverError: MongoServerError | null | undefined
) => {
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
export const findAtlasOperator = (operators: string[]) => {
  return operators.find((operator) => isAtlasOnlyStage(operator));
};

export function hasSyntaxError(stage: StoreStage) {
  return !!stage.syntaxError && !!stage.stageOperator && !!stage.value;
}
