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

/**
 * Map stage operators to doc URLS.
 */
export const STAGE_SPRINKLE_MAPPINGS = {
  $addFields: {
    link: 'https://docs.mongodb.com/manual/reference/operator/aggregation/addFields/#pipe._S_addFields',
    tooltip: 'Adds new field(s) to a document with a computed value, or reassigns an existing field(s) with a computed value.'
  },
  $bucket: {
    link: 'https://docs.mongodb.com/manual/reference/operator/aggregation/bucket/#pipe._S_bucket',
    tooltip: 'Categorizes incoming documents into groups, called buckets, based on specified boundaries.'
  },
  $bucketAuto: {
    link: 'https://docs.mongodb.com/manual/reference/operator/aggregation/bucketAuto/#pipe._S_bucketAuto',
    tooltip: 'Automatically categorizes documents into a specified number of buckets, attempting even distribution if possible.'
  },
  $collStats: {
    link: 'https://docs.mongodb.com/manual/reference/operator/aggregation/collStats/#pipe._S_collStats',
    tooltip: 'Returns statistics regarding a collection or view.'
  },
  $count: {
    link: 'https://docs.mongodb.com/manual/reference/operator/aggregation/count/#pipe._S_count',
    tooltip: 'Returns a count of the number of documents at this stage of the aggregation pipeline.'
  },
  $currentOp: {
    link: 'https://docs.mongodb.com/manual/reference/operator/aggregation/currentOp/#pipe._S_currentOp',
    tooltip: ''
  },
  $densify: {
    link: 'https://docs.mongodb.com/rapid/reference/operator/aggregation/densify',
    tooltip: 'Creates new documents in a sequence of documents where certain values in a field are missing.'
  },
  $documents: {
    link: 'https://docs.mongodb.com/v5.1/reference/operator/aggregation/documents/#mongodb-pipeline-pipe.-documents',
    tooltip: 'Returns literal documents from input values.'
  },
  $facet: {
    link: 'https://docs.mongodb.com/manual/reference/operator/aggregation/facet/#pipe._S_facet',
    tooltip: 'Allows for multiple parallel aggregations to be specified.'
  },
  $geoNear: {
    link: 'https://docs.mongodb.com/manual/reference/operator/aggregation/geoNear/#pipe._S_geoNear',
    tooltip: 'Returns documents based on proximity to a geospatial point.'
  },
  $graphLookup: {
    link: 'https://docs.mongodb.com/manual/reference/operator/aggregation/graphLookup/#pipe._S_graphLookup',
    tooltip: 'Performs a recursive search on a collection. To each output document, adds a new array field that contains the traversal results of the recursive search for that document.'
  },
  $group: {
    link: 'https://docs.mongodb.com/manual/reference/operator/aggregation/group/#pipe._S_group',
    tooltip: 'Groups documents by a specified expression.'
  },
  $indexStats: {
    link: 'https://docs.mongodb.com/manual/reference/operator/aggregation/indexStats/#pipe._S_indexStats',
    tooltip: 'Returns statistics regarding the use of each index for the collection.'
  },
  $limit: {
    link: 'https://docs.mongodb.com/manual/reference/operator/aggregation/limit/#pipe._S_limit',
    tooltip: 'Limits the number of documents that flow into subsequent stages.'
  },
  $listLocalSessions: {
    link: 'https://docs.mongodb.com/manual/reference/operator/aggregation/listLocalSessions/#pipe._S_listLocalSessions',
    tooltip: ''
  },
  $listSessions: {
    link: 'https://docs.mongodb.com/manual/reference/operator/aggregation/listSessions/#pipe._S_listSessions',
    tooltip: ''
  },
  $lookup: {
    link: 'https://docs.mongodb.com/manual/reference/operator/aggregation/lookup/#pipe._S_lookup',
    tooltip: 'Performs a join between two collections.'
  },
  $match: {
    link: 'https://docs.mongodb.com/manual/reference/operator/aggregation/match/#pipe._S_match',
    tooltip: 'Filters the document stream to allow only matching documents to pass through to subsequent stages.'
  },
  $merge: {
    link: 'https://docs.mongodb.com/manual/reference/operator/aggregation/merge/#pipe._S_merge',
    tooltip: 'Merges the resulting documents into a collection, optionally overriding existing documents.'
  },
  $out: {
    link: 'https://docs.mongodb.com/manual/reference/operator/aggregation/out/#pipe._S_out',
    tooltip: 'Writes the result of a pipeline to a new or existing collection.'
  },
  $project: {
    link: 'https://docs.mongodb.com/manual/reference/operator/aggregation/project/#pipe._S_project',
    tooltip: 'Adds new field(s) to a document with a computed value, or reassigns an existing field(s) with a computed value. Unlike $addFields, $project can also remove fields.'
  },
  $redact: {
    link: 'https://docs.mongodb.com/manual/reference/operator/aggregation/redact/#pipe._S_redact',
    tooltip: 'Restricts the content for each document based on information stored in the documents themselves.'
  },
  $replaceRoot: {
    link: 'https://docs.mongodb.com/manual/reference/operator/aggregation/replaceRoot/#pipe._S_replaceRoot',
    tooltip: 'Replaces a document with the specified embedded document.'
  },
  $replaceWith: {
    link: 'https://docs.mongodb.com/manual/reference/operator/aggregation/replaceWith/',
    tooltip: 'Replaces a document with the specified embedded document.'
  },
  $sample: {
    link: 'https://docs.mongodb.com/manual/reference/operator/aggregation/sample/#pipe._S_sample',
    tooltip: 'Randomly selects the specified number of documents from its input.'
  },
  $search: {
    link: 'https://docs.atlas.mongodb.com/reference/full-text-search/query-syntax/#pipe._S_search',
    tooltip: 'Performs a full-text search on the specified field(s).'
  },
  $searchMeta: {
    link: 'https://docs.atlas.mongodb.com/reference/atlas-search/query-syntax-dupl/#mongodb-pipeline-pipe.-searchMeta',
    tooltip: 'Performs a full-text search on the specified field(s) and gets back only the generated search meta data from a query.'
  },
  $set: {
    link: 'https://docs.mongodb.com/manual/reference/operator/aggregation/set/#pipe._S_set',
    tooltip: 'Adds new fields to documents.'
  },
  $skip: {
    link: 'https://docs.mongodb.com/manual/reference/operator/aggregation/skip/#pipe._S_skip',
    tooltip: 'Skips a specified number of documents before advancing to the next stage.'
  },
  $sort: {
    link: 'https://docs.mongodb.com/manual/reference/operator/aggregation/sort/#pipe._S_sort',
    tooltip: 'Reorders the document stream by a specified sort key and direction.'
  },
  $sortByCount: {
    link: 'https://docs.mongodb.com/manual/reference/operator/aggregation/sortByCount/#pipe._S_sortByCount',
    tooltip: 'Groups incoming documents based on the value of a specified expression, then computes the count of documents in each distinct group.'
  },
  $unset: {
    link: 'https://docs.mongodb.com/manual/reference/operator/aggregation/unset/',
    tooltip: 'Removes or excludes fields from documents.'
  },
  $unwind: {
    link: 'https://docs.mongodb.com/manual/reference/operator/aggregation/unwind/#pipe._S_unwind',
    tooltip: 'Outputs a new document for each element in a specified array. '
  }
};
