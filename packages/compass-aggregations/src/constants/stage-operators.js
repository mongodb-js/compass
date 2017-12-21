/**
 * The stage operators.
 */
const STAGE_OPERATORS = [
  {
    name: '$addFields',
    value: '$addFields',
    label: '$addFields',
    score: 1,
    meta: 'stage',
    version: '3.4.0',
    description: 'Adds new fields to documents.'
  },
  {
    name: '$bucket',
    value: '$bucket',
    label: '$bucket',
    score: 1,
    meta: 'stage',
    version: '3.4.0',
    description: 'Categorizes incoming documents into groups, called buckets, based on a specified expression and bucket boundaries.'
  },
  {
    name: '$bucketAuto',
    value: '$bucketAuto',
    label: '$bucketAuto',
    score: 1,
    meta: 'stage',
    version: '3.4.0',
    description: 'Categorizes incoming documents into a specific number of groups, called buckets, based on a specified expression. Bucket boundaries are automatically determined in an attempt to evenly distribute the documents into the specified number of buckets.'
  },
  {
    name: '$collStats',
    value: '$collStats',
    label: '$collStats',
    snippet: '{\n  latencyStats: {\n    histograms: true\n  },\n  storageStats: {}\n}',
    score: 1,
    meta: 'stage',
    version: '3.4.0',
    description: 'Returns statistics regarding a collection or view.'
  },
  {
    name: '$count',
    value: '$count',
    label: '$count',
    score: 1,
    meta: 'stage',
    version: '2.2.0',
    description: 'Returns a count of the number of documents at this stage of the aggregation pipeline.'
  },
  {
    name: '$currentOp',
    value: '$currentOp',
    label: '$currentOp',
    score: 1,
    meta: 'stage',
    version: '3.6.0',
    description: 'Returns information on active and/or dormant operations for the MongoDB deployment.'
  },
  {
    name: '$facet',
    value: '$facet',
    label: '$facet',
    score: 1,
    meta: 'stage',
    version: '3.4.0',
    description: 'Processes multiple aggregation pipelines within a single stage on the same set of input documents.'
  },
  {
    name: '$geoNear',
    value: '$geoNear',
    label: '$geoNear',
    score: 1,
    meta: 'stage',
    version: '2.4.0',
    description: 'Returns an ordered stream of documents based on the proximity to a geospatial point.'
  },
  {
    name: '$graphLookup',
    value: '$graphLookup',
    label: '$graphLookup',
    score: 1,
    meta: 'stage',
    version: '3.4.0',
    description: 'Performs a recursive search on a collection.'
  },
  {
    name: '$group',
    value: '$group',
    label: '$group',
    score: 1,
    meta: 'stage',
    version: '2.2.0',
    description: 'Groups input documents by a specified identifier expression and applies the accumulator expression(s), if specified, to each group.'
  },
  {
    name: '$indexStats',
    value: '$indexStats',
    label: '$indexStats',
    score: 1,
    meta: 'stage',
    version: '3.2.0',
    description: 'Returns statistics regarding the use of each index for the collection.'
  },
  {
    name: '$limit',
    value: '$limit',
    label: '$limit',
    score: 1,
    meta: 'stage',
    version: '2.2.0',
    description: 'Passes the first n documents unmodified to the pipeline where n is the specified limit.'
  },
  {
    name: '$listLocalSessions',
    value: '$listLocalSessions',
    label: '$listLocalSessions',
    score: 1,
    meta: 'stage',
    version: '3.6.0',
    description: 'Lists all active sessions recently in use on the currently connected mongos or mongod instance.'
  },
  {
    name: '$listSessions',
    value: '$listSessions',
    label: '$listSessions',
    score: 1,
    meta: 'stage',
    version: '3.6.0',
    description: 'Lists all sessions that have been active long enough to propagate to the system.sessions collection.'
  },
  {
    name: '$lookup',
    value: '$lookup',
    label: '$lookup',
    score: 1,
    meta: 'stage',
    version: '3.2.0',
    description: 'Performs a left outer join to another collection in the same database to filter in documents from the “joined” collection for processing.'
  },
  {
    name: '$match',
    value: '$match',
    label: '$match',
    score: 1,
    meta: 'stage',
    version: '2.2.0',
    description: 'Filters the document stream to allow only matching documents to pass unmodified into the next pipeline stage.'
  },
  {
    name: '$out',
    value: '$out',
    label: '$out',
    score: 1,
    meta: 'stage',
    version: '2.2.0',
    description: 'Writes the resulting documents of the aggregation pipeline to a collection.'
  },
  {
    name: '$project',
    value: '$project',
    label: '$project',
    score: 1,
    meta: 'stage',
    version: '2.2.0',
    description: 'Reshapes each document in the stream, such as by adding new fields or removing existing fields.'
  },
  {
    name: '$redact',
    value: '$redact',
    label: '$redact',
    score: 1,
    meta: 'stage',
    version: '2.6.0',
    description: 'Reshapes each document in the stream by restricting the content for each document based on information stored in the documents themselves.'
  },
  {
    name: '$replaceRoot',
    value: '$replaceRoot',
    label: '$replaceRoot',
    score: 1,
    meta: 'stage',
    version: '3.4.0',
    description: 'Replaces a document with the specified embedded document.'
  },
  {
    name: '$sample',
    value: '$sample',
    label: '$sample',
    score: 1,
    meta: 'stage',
    version: '3.2.0',
    description: 'Randomly selects the specified number of documents from its input.\n'
  },
  {
    name: '$skip',
    value: '$skip',
    label: '$skip',
    score: 1,
    meta: 'stage',
    version: '2.2.0',
    description: 'Skips the first n documents where n is the specified skip number and passes the remaining documents unmodified to the pipeline.'
  },
  {
    name: '$sort',
    value: '$sort',
    label: '$sort',
    score: 1,
    meta: 'stage',
    version: '2.2.0',
    description: 'Reorders the document stream by a specified sort key.'
  },
  {
    name: '$sortByCount',
    value: '$sortByCount',
    label: '$sortByCount',
    score: 1,
    meta: 'stage',
    version: '3.4.0',
    description: 'Groups incoming documents based on the value of a specified expression, then computes the count of documents in each distinct group.'
  },
  {
    name: '$unwind',
    value: '$unwind',
    label: '$unwind',
    score: 1,
    meta: 'stage',
    version: '2.2.0',
    description: 'Deconstructs an array field from the input documents to output a document for each element.'
  }
];

/**
 * The list of stage operator names.
 */
const STAGE_OPERATOR_NAMES = STAGE_OPERATORS.map(op => op.name);

export default STAGE_OPERATORS;
export { STAGE_OPERATOR_NAMES };
