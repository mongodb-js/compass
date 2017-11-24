/**
 * The stage operators.
 */
const STAGE_OPERATORS = [
  {
    name: '$addFields',
    value: '$addFields',
    score: 1,
    meta: 'stage'
  },
  {
    name: '$bucket',
    value: '$bucket',
    score: 1,
    meta: 'stage'
  },
  {
    name: '$bucketAuto',
    value: '$bucketAuto',
    score: 1,
    meta: 'stage'
  },
  {
    name: '$collStats',
    value: '$collStats',
    score: 1,
    meta: 'stage'
  },
  {
    name: '$count',
    value: '$count',
    score: 1,
    meta: 'stage'
  },
  {
    name: '$facet',
    value: '$facet',
    score: 1,
    meta: 'stage'
  },
  {
    name: '$geoNear',
    value: '$geoNear',
    score: 1,
    meta: 'stage'
  },
  {
    name: '$graphLookup',
    value: '$graphLookup',
    score: 1,
    meta: 'stage'
  },
  {
    name: '$group',
    value: '$group',
    score: 1,
    meta: 'stage'
  },
  {
    name: '$indexStats',
    value: '$indexStats',
    score: 1,
    meta: 'stage'
  },
  {
    name: '$limit',
    value: '$limit',
    score: 1,
    meta: 'stage'
  },
  {
    name: '$lookup',
    value: '$lookup',
    score: 1,
    meta: 'stage'
  },
  {
    name: '$match',
    value: '$match',
    score: 1,
    meta: 'stage'
  },
  {
    name: '$out',
    value: '$out',
    score: 1,
    meta: 'stage'
  },
  {
    name: '$project',
    value: '$project',
    score: 1,
    meta: 'stage'
  },
  {
    name: '$redact',
    value: '$redact',
    score: 1,
    meta: 'stage'
  },
  {
    name: '$replaceRoot',
    value: '$replaceRoot',
    score: 1,
    meta: 'stage'
  },
  {
    name: '$sample',
    value: '$sample',
    score: 1,
    meta: 'stage'
  },
  {
    name: '$skip',
    value: '$skip',
    score: 1,
    meta: 'stage'
  },
  {
    name: '$sort',
    value: '$sort',
    score: 1,
    meta: 'stage'
  },
  {
    name: '$sortByCount',
    value: '$sortByCount',
    score: 1,
    meta: 'stage'
  },
  {
    name: '$unwind',
    value: '$unwind',
    score: 1,
    meta: 'stage'
  }
];

export default STAGE_OPERATORS;
export { STAGE_OPERATORS };
