/**
 * The query operators.
 */
const QUERY_OPERATORS = [
  {
    name: '$all',
    value: '$all',
    score: 1,
    meta: 'query',
    version: '2.2.0'
  },
  {
    name: '$and',
    value: '$and',
    score: 1,
    meta: 'query',
    version: '2.2.0'
  },
  {
    name: '$bitsAllClear',
    value: '$bitsAllClear',
    score: 1,
    meta: 'query',
    version: '3.2.0'
  },
  {
    name: '$bitsAllSet',
    value: '$bitsAllSet',
    score: 1,
    meta: 'query',
    version: '3.2.0'
  },
  {
    name: '$bitsAnyClear',
    value: '$bitsAnyClear',
    score: 1,
    meta: 'query',
    version: '3.2.0'
  },
  {
    name: '$bitsAnySet',
    value: '$bitsAnySet',
    score: 1,
    meta: 'query',
    version: '3.2.0'
  },
  {
    name: '$comment',
    value: '$comment',
    score: 1,
    meta: 'query',
    version: '3.2.0'
  },
  {
    name: '$elemMatch',
    value: '$elemMatch',
    score: 1,
    meta: 'query',
    version: '2.2.0'
  },
  {
    name: '$eq',
    value: '$eq',
    score: 1,
    meta: 'query',
    version: '2.2.0'
  },
  {
    name: '$exists',
    value: '$exists',
    score: 1,
    meta: 'query',
    version: '2.2.0'
  },
  {
    name: '$expr',
    value: '$expr',
    score: 1,
    meta: 'query',
    version: '3.6.0'
  },
  {
    name: '$geoIntersects',
    value: '$geoIntersects',
    score: 1,
    meta: 'query',
    version: '2.2.0'
  },
  {
    name: '$geoWithin',
    value: '$geoWithin',
    score: 1,
    meta: 'query',
    version: '2.2.0'
  },
  {
    name: '$gt',
    value: '$gt',
    score: 1,
    meta: 'query',
    version: '2.2.0'
  },
  {
    name: '$gte',
    value: '$gte',
    score: 1,
    meta: 'query',
    version: '2.2.0'
  },
  {
    name: '$in',
    value: '$in',
    score: 1,
    meta: 'query',
    version: '2.2.0'
  },
  {
    name: '$jsonSchema',
    value: '$jsonSchema',
    score: 1,
    meta: 'query',
    version: '3.6.0'
  },
  {
    name: '$lt',
    value: '$lt',
    score: 1,
    meta: 'query',
    version: '2.2.0'
  },
  {
    name: '$lte',
    value: '$lte',
    score: 1,
    meta: 'query',
    version: '2.2.0'
  },
  {
    name: '$mod',
    value: '$mod',
    score: 1,
    meta: 'query',
    version: '2.2.0'
  },
  {
    name: '$ne',
    value: '$ne',
    score: 1,
    meta: 'query',
    version: '2.2.0'
  },
  {
    name: '$near',
    value: '$near',
    score: 1,
    meta: 'query',
    version: '2.2.0'
  },
  {
    name: '$nearSphere',
    value: '$nearSphere',
    score: 1,
    meta: 'query',
    version: '2.2.0'
  },
  {
    name: '$nin',
    value: '$nin',
    score: 1,
    meta: 'query',
    version: '2.2.0'
  },
  {
    name: '$not',
    value: '$not',
    score: 1,
    meta: 'query',
    version: '2.2.0'
  },
  {
    name: '$nor',
    value: '$nor',
    score: 1,
    meta: 'query',
    version: '2.2.0'
  },
  {
    name: '$or',
    value: '$or',
    score: 1,
    meta: 'query',
    version: '2.2.0'
  },
  {
    name: '$regex',
    value: '$regex',
    score: 1,
    meta: 'query',
    version: '2.2.0'
  },
  {
    name: '$size',
    value: '$size',
    score: 1,
    meta: 'query',
    version: '2.2.0'
  },
  {
    name: '$slice',
    value: '$slice',
    score: 1,
    meta: 'query',
    version: '2.2.0'
  },
  {
    name: '$text',
    value: '$text',
    score: 1,
    meta: 'query',
    version: '2.2.0'
  },
  {
    name: '$type',
    value: '$type',
    score: 1,
    meta: 'query',
    version: '2.2.0'
  },
  {
    name: '$where',
    value: '$where',
    score: 1,
    meta: 'query',
    version: '2.2.0'
  }
];

export default QUERY_OPERATORS;
