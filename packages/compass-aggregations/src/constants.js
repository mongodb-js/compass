/**
 * Default for maxTimeMS option.
 */
export const DEFAULT_MAX_TIME_MS = 60000;

/**
 * Number of documents to sample.
 */
export const DEFAULT_SAMPLE_SIZE = 10;

/**
 * If a stage is one of `FULL_SCAN_OPS`,
 * prepend with $limit if the collection is large.
 */
export const DEFAULT_LARGE_LIMIT = 100000;

export const OUT_STAGE_PREVIEW_TEXT =
  'The $out operator will cause the pipeline to persist ' +
  'the results to the specified location (collection, S3, or Atlas). ' +
  'If the collection exists it will be replaced.';

export const MERGE_STAGE_PREVIEW_TEXT =
  'The $merge operator will cause the pipeline to persist the results to ' +
  'the specified location.';

export const PIPELINE_HELP_URI =
  'https://www.mongodb.com/docs/manual/reference/operator/aggregation-pipeline/?utm_source=compass&utm_medium=product';

export const STAGE_HELP_BASE_URL =
  // Disabled here because the parameters are added in getStageHelpLink method
  // in: packages/compass-aggregations/src/utils/stage.js
  // eslint-disable-next-line @mongodb-js/compass/no-mongodb-link-without-utm-params
  'https://www.mongodb.com/docs/manual/reference/operator/aggregation';
