/**
 * Default for maxTimeMS option.
 */
export const DEFAULT_MAX_TIME_MS = 5000;

/**
 * Number of documents to sample.
 */
export const DEFAULT_SAMPLE_SIZE = 20;

/**
 * If a stage is one of `FULL_SCAN_OPS`,
 * prepend with $limit if the collection is large.
 */
export const DEFAULT_LARGE_LIMIT = 100000;

/**
 * N/A contant.
 */
export const NA = 'N/A';

/**
 * Stage operators that are required to be the first stage.
 */
export const REQUIRED_AS_FIRST_STAGE = [
  '$collStats',
  '$currentOp',
  '$indexStats',
  '$listLocalSessions',
  '$listSessions'
];

export const VIEWS_MIN_SERVER_VERSION = '3.4.0';

/**
 * Ops that must scan the entire results before moving to the
 * next stage.
 */
export const FULL_SCAN_OPS = ['$group', '$bucket', '$bucketAuto'];

/**
 * The out stage operator.
 */
export const OUT = '$out';

/**
 * The default snippet.
 */
export const DEFAULT_SNIPPET = '{\n  \n}';

export const TOOLTIP_PREVIEW_MODE =
  'Show a preview of resulting documents after <br />' +
  'each stage in the pipeline.';

export const TOOLTIP_SAMPLING_MODE =
  'Use a random sample of documents instead of<br />' +
  'the entire collection so you can develop your<br />' +
  'pipeline quickly. Sample size can be specified<br />' +
  'in the settings panel.';

export const TOOLTIP_EXPORT_TO_LANGUAGE = 'Export pipeline code to language';

export const TOOLTIP_CREATE_NEW_PIPELINE = 'Create new pipeline';

export const TOOLTIP_OPEN_SAVED_PIPELINES = 'Open saved Pipelines';
