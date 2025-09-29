/**
 * Data Explorer limits (5 minutes = 300,000ms)
 * This limit is artificial but necessary for the backend that powers DE.
 * https://github.com/10gen/mms/blob/dea184f4a40db0a64ed0d6665d36265f62ae4f65/server/src/main/com/xgen/cloud/services/clusterconnection/runtime/ws/ClusterConnectionServerProvider.java#L50-L51
 */
export const WEB_MAX_TIME_MS_LIMIT = 300_000;

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
  'https://www.mongodb.com/docs/manual/reference/operator/aggregation-pipeline/';

export const STAGE_HELP_BASE_URL =
  'https://www.mongodb.com/docs/manual/reference/operator/aggregation';
