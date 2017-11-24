/**
 * The stage operators.
 */
const STAGE_OPERATORS = [
  {
    name: '$addFields',
    value: '$addFields',
    score: 1,
    meta: ''
  },
  {
    name: '$bucket',
    value: '$bucket',
    score: 1,
    meta: ''
  },
  {
    name: '$bucketAuto',
    value: '$bucketAuto',
    score: 1,
    meta: ''
  },
  {
    name: '$collStats',
    value: '$collStats',
    score: 1,
    meta: ''
  },
  {
    name: '$count',
    value: '$count',
    score: 1,
    meta: ''
  },
  {
    name: '$facet',
    value: '$facet',
    score: 1,
    meta: ''
  },
  {
    name: '$geoNear',
    value: '$geoNear',
    score: 1,
    meta: ''
  },
  {
    name: '$graphLookup',
    value: '$graphLookup',
    score: 1,
    meta: ''
  },
  {
    name: '$group',
    value: '$group',
    score: 1,
    meta: ''
  },
  {
    name: '$indexStats',
    value: '$indexStats',
    score: 1,
    meta: ''
  },
  {
    name: '$limit',
    value: '$limit',
    score: 1,
    meta: ''
  },
  {
    name: '$lookup',
    value: '$lookup',
    score: 1,
    meta: ''
  },
  {
    name: '$match',
    value: '$match',
    score: 1,
    meta: ''
  },
  {
    name: '$out',
    value: '$out',
    score: 1,
    meta: ''
  },
  {
    name: '$project',
    value: '$project',
    score: 1,
    meta: ''
  },
  {
    name: '$redact',
    value: '$redact',
    score: 1,
    meta: ''
  },
  {
    name: '$replaceRoot',
    value: '$replaceRoot',
    score: 1,
    meta: ''
  },
  {
    name: '$sample',
    value: '$sample',
    score: 1,
    meta: ''
  },
  {
    name: '$skip',
    value: '$skip',
    score: 1,
    meta: ''
  },
  {
    name: '$sort',
    value: '$sort',
    score: 1,
    meta: ''
  },
  {
    name: '$sortByCount',
    value: '$sortByCount',
    score: 1,
    meta: ''
  },
  {
    name: '$unwind',
    value: '$unwind',
    score: 1,
    meta: ''
  }
];

export default STAGE_OPERATORS;
export { STAGE_OPERATORS };
