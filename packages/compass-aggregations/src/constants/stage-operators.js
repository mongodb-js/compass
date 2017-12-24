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
    description: 'Adds new fields to documents.',
    snippet: '{\n  ${1:field}: ${2:expr}, ${3:...}\n}'
  },
  {
    name: '$bucket',
    value: '$bucket',
    label: '$bucket',
    score: 1,
    meta: 'stage',
    version: '3.4.0',
    description: 'Categorizes incoming documents into groups, called buckets, based on a specified expression and bucket boundaries.',
    snippet: '{\n  groupBy: ${1:expr},\n  boundaries: [ ${2:lowerbound}, ${3:...} ],\n  default: ${4:literal},\n  output: {\n     ${5:field}: { ${6:accumulator} }, ${7:...}\n  }\n}'
  },
  {
    name: '$bucketAuto',
    value: '$bucketAuto',
    label: '$bucketAuto',
    score: 1,
    meta: 'stage',
    version: '3.4.0',
    description: 'Categorizes incoming documents into a specific number of groups, called buckets, based on a specified expression. Bucket boundaries are automatically determined in an attempt to evenly distribute the documents into the specified number of buckets.',
    snippet: '{\n  groupBy: ${1:expr},\n  buckets: ${2:0},\n  output: {\n    ${3:field}: ${4:accumulator}, ${5:...}\n  },\ngranularity: \'${6}\'\n}'
  },
  {
    name: '$collStats',
    value: '$collStats',
    label: '$collStats',
    score: 1,
    meta: 'stage',
    version: '3.4.0',
    description: 'Returns statistics regarding a collection or view.',
    snippet: '{\n  latencyStats: {\n    histograms: ${1:false}\n  },\n  storageStats: {${2:}},\n  count: {${3}}\n}'
  },
  {
    name: '$count',
    value: '$count',
    label: '$count',
    score: 1,
    meta: 'stage',
    version: '2.2.0',
    description: 'Returns a count of the number of documents at this stage of the aggregation pipeline.',
    snippet: '${1:0}'
  },
  {
    name: '$currentOp',
    value: '$currentOp',
    label: '$currentOp',
    score: 1,
    meta: 'stage',
    version: '3.6.0',
    description: 'Returns information on active and/or dormant operations for the MongoDB deployment.',
    snippet: '{\n  allUsers: ${1:false},\n  idleConnections: ${2:false}\n}'
  },
  {
    name: '$facet',
    value: '$facet',
    label: '$facet',
    score: 1,
    meta: 'stage',
    version: '3.4.0',
    description: 'Processes multiple aggregation pipelines within a single stage on the same set of input documents.',
    snippet: '{\n  ${1:field}: [ ${2:stage}, ${3:...} ], ${4:...}\n}'
  },
  {
    name: '$geoNear',
    value: '$geoNear',
    label: '$geoNear',
    score: 1,
    meta: 'stage',
    version: '2.4.0',
    description: 'Returns an ordered stream of documents based on the proximity to a geospatial point.',
    snippet: '{\n  ${1:geoNear options}\n}'
  },
  {
    name: '$graphLookup',
    value: '$graphLookup',
    label: '$graphLookup',
    score: 1,
    meta: 'stage',
    version: '3.4.0',
    description: 'Performs a recursive search on a collection.',
    snippet: '{\n  from: ${1:collection},\n' +
    '  startWith: ${2:expr},\n' +
    '  connectFromField: \'${3}\',\n' +
    '  connectToField: \'${4}\',\n' +
    '  as: \'${5}\',\n' +
    '  maxDepth: ${6:0},\n' +
    '  depthField: \'${7}\',\n' +
    '  restrictSearchWithMatch: {${8}}\n}'
  },
  {
    name: '$group',
    value: '$group',
    label: '$group',
    score: 1,
    meta: 'stage',
    version: '2.2.0',
    description: 'Groups input documents by a specified identifier expression and applies the accumulator expression(s), if specified, to each group.',
    snippet: '{\n  _id: ${1:expr},\n  ${2:field}: {\n    ${3:accumulator}: ${4:expr}\n  }\n}'
  },
  {
    name: '$indexStats',
    value: '$indexStats',
    label: '$indexStats',
    score: 1,
    meta: 'stage',
    version: '3.2.0',
    description: 'Returns statistics regarding the use of each index for the collection.',
    snippet: '{\n  ${1}\n}'
  },
  {
    name: '$limit',
    value: '$limit',
    label: '$limit',
    score: 1,
    meta: 'stage',
    version: '2.2.0',
    description: 'Passes the first n documents unmodified to the pipeline where n is the specified limit.',
    snippet: '${1:1}'
  },
  {
    name: '$listLocalSessions',
    value: '$listLocalSessions',
    label: '$listLocalSessions',
    score: 1,
    meta: 'stage',
    version: '3.6.0',
    description: 'Lists all active sessions recently in use on the currently connected mongos or mongod instance.',
    snippet: '{\n  ${1}\n}'
  },
  {
    name: '$listSessions',
    value: '$listSessions',
    label: '$listSessions',
    score: 1,
    meta: 'stage',
    version: '3.6.0',
    description: 'Lists all sessions that have been active long enough to propagate to the system.sessions collection.',
    snippet: '{\n  {${1}}\n}'
  },
  {
    name: '$lookup',
    value: '$lookup',
    label: '$lookup',
    score: 1,
    meta: 'stage',
    version: '3.2.0',
    description: 'Performs a left outer join to another collection in the same database to filter in documents from the “joined” collection for processing.',
    snippet: '{\n  from: ${1:collection},\n' +
    '  localField: ${2:field},\n' +
    '  foreignField: ${3:field},\n' +
    '  as: [${4}]\n}'
  },
  {
    name: '$match',
    value: '$match',
    label: '$match',
    score: 1,
    meta: 'stage',
    version: '2.2.0',
    description: 'Filters the document stream to allow only matching documents to pass unmodified into the next pipeline stage.',
    snippet: '{\n  ${1:query}\n}'
  },
  {
    name: '$out',
    value: '$out',
    label: '$out',
    score: 1,
    meta: 'stage',
    version: '2.2.0',
    description: 'Writes the resulting documents of the aggregation pipeline to a collection.',
    snippet: '{\n  ${1:collection}\n}'
  },
  {
    name: '$project',
    value: '$project',
    label: '$project',
    score: 1,
    meta: 'stage',
    version: '2.2.0',
    description: 'Reshapes each document in the stream, such as by adding new fields or removing existing fields.',
    snippet: '{\n  ${1:project specifications}\n}'
  },
  {
    name: '$redact',
    value: '$redact',
    label: '$redact',
    score: 1,
    meta: 'stage',
    version: '2.6.0',
    description: 'Reshapes each document in the stream by restricting the content for each document based on information stored in the documents themselves.',
    snippet: '{\n  ${1:expr}\n}'
  },
  {
    name: '$replaceRoot',
    value: '$replaceRoot',
    label: '$replaceRoot',
    score: 1,
    meta: 'stage',
    version: '3.4.0',
    description: 'Replaces a document with the specified embedded document.',
    snippet: '{\n  newRoot: {${1}}\n}'
  },
  {
    name: '$sample',
    value: '$sample',
    label: '$sample',
    score: 1,
    meta: 'stage',
    version: '3.2.0',
    description: 'Randomly selects the specified number of documents from its input.',
    snippet: '{\n  size: ${1:1}\n}'
  },
  {
    name: '$skip',
    value: '$skip',
    label: '$skip',
    score: 1,
    meta: 'stage',
    version: '2.2.0',
    description: 'Skips the first n documents where n is the specified skip number and passes the remaining documents unmodified to the pipeline.',
    snippet: '{\n  ${1}\n}'
  },
  {
    name: '$sort',
    value: '$sort',
    label: '$sort',
    score: 1,
    meta: 'stage',
    version: '2.2.0',
    description: 'Reorders the document stream by a specified sort key.',
    snippet: '{\n  ${1:field}: ${2:1}, ${3:...}\n}'
  },
  {
    name: '$sortByCount',
    value: '$sortByCount',
    label: '$sortByCount',
    score: 1,
    meta: 'stage',
    version: '3.4.0',
    description: 'Groups incoming documents based on the value of a specified expression, then computes the count of documents in each distinct group.',
    snippet: '{\n  ${1:expr}\n}'
  },
  {
    name: '$unwind',
    value: '$unwind',
    label: '$unwind',
    score: 1,
    meta: 'stage',
    version: '2.2.0',
    description: 'Deconstructs an array field from the input documents to output a document for each element.',
    snippet: '{\n  path: ${1:field path},\n' +
    '  includeArrayIndex: \'${2}\',\n' +
    '  preserveNullAndEmptyArrays: ${3:false}\n}'
  }
];

/**
 * The list of stage operator names.
 */
const STAGE_OPERATOR_NAMES = STAGE_OPERATORS.map(op => op.name);

export default STAGE_OPERATORS;
export { STAGE_OPERATOR_NAMES };
