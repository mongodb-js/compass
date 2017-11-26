/**
 * The stage operators.
 */
const STAGE_OPERATORS = [
  {
    name: '$addFields',
    value: '$addFields',
    score: 1,
    meta: 'stage',
    version: '3.4.0'
  },
  {
    name: '$bucket',
    value: '$bucket',
    score: 1,
    meta: 'stage',
    version: '3.4.0'
  },
  {
    name: '$bucketAuto',
    value: '$bucketAuto',
    score: 1,
    meta: 'stage',
    version: '3.4.0'
  },
  {
    name: '$collStats',
    value: '$collStats',
    score: 1,
    meta: 'stage',
    version: '3.4.0'
  },
  {
    name: '$count',
    value: '$count',
    score: 1,
    meta: 'stage',
    version: '2.2.0'
  },
  {
    name: '$facet',
    value: '$facet',
    score: 1,
    meta: 'stage',
    version: '3.4.0'
  },
  {
    name: '$geoNear',
    value: '$geoNear',
    score: 1,
    meta: 'stage',
    version: '2.4.0'
  },
  {
    name: '$graphLookup',
    value: '$graphLookup',
    score: 1,
    meta: 'stage',
    version: '3.4.0'
  },
  {
    name: '$group',
    value: '$group',
    score: 1,
    meta: 'stage',
    version: '2.2.0'
  },
  {
    name: '$indexStats',
    value: '$indexStats',
    score: 1,
    meta: 'stage',
    version: '3.2.0'
  },
  {
    name: '$limit',
    value: '$limit',
    score: 1,
    meta: 'stage',
    version: '2.2.0'
  },
  {
    name: '$lookup',
    value: '$lookup',
    score: 1,
    meta: 'stage',
    version: '3.2.0'
  },
  {
    name: '$match',
    value: '$match',
    score: 1,
    meta: 'stage',
    version: '2.2.0'
  },
  {
    name: '$out',
    value: '$out',
    score: 1,
    meta: 'stage',
    version: '2.2.0'
  },
  {
    name: '$project',
    value: '$project',
    score: 1,
    meta: 'stage',
    version: '2.2.0'
  },
  {
    name: '$redact',
    value: '$redact',
    score: 1,
    meta: 'stage',
    version: '2.6.0'
  },
  {
    name: '$replaceRoot',
    value: '$replaceRoot',
    score: 1,
    meta: 'stage',
    version: '3.4.0'
  },
  {
    name: '$sample',
    value: '$sample',
    score: 1,
    meta: 'stage',
    version: '3.2.0'
  },
  {
    name: '$skip',
    value: '$skip',
    score: 1,
    meta: 'stage',
    version: '2.2.0'
  },
  {
    name: '$sort',
    value: '$sort',
    score: 1,
    meta: 'stage',
    version: '2.2.0'
  },
  {
    name: '$sortByCount',
    value: '$sortByCount',
    score: 1,
    meta: 'stage',
    version: '3.4.0'
  },
  {
    name: '$unwind',
    value: '$unwind',
    score: 1,
    meta: 'stage',
    version: '2.2.0'
  }
];

export default STAGE_OPERATORS;
export { STAGE_OPERATORS };
