/**
 * The BSON types.
 */
const BSON_TYPES = [
  {
    name: 'Code',
    value: 'Code',
    label: 'Code',
    score: 1,
    meta: 'bson',
    version: '0.0.0',
    description: 'BSON Code type',
    snippet: "Code('${1:code}')"
  },
  {
    name: 'ObjectId',
    value: 'ObjectId',
    label: 'ObjectId',
    score: 1,
    meta: 'bson',
    version: '0.0.0',
    description: 'BSON ObjectId type',
    snippet: "ObjectId('${1:id}')"
  },
  {
    name: 'Binary',
    value: 'Binary',
    label: 'Binary',
    score: 1,
    meta: 'bson',
    version: '0.0.0',
    description: 'BSON Binary type',
    snippet: "Binary('${1:data}', '${2:subType}')"
  },
  {
    name: 'DBRef',
    value: 'DBRef',
    label: 'DBRef',
    score: 1,
    meta: 'bson',
    version: '0.0.0',
    description: 'BSON DBRef type',
    snippet: "DBRef('${1:ns}', '${2:oid}')"
  },
  {
    name: 'Timestamp',
    value: 'Timestamp',
    label: 'Timestamp',
    score: 1,
    meta: 'bson',
    version: '0.0.0',
    description: 'BSON Timestamp type',
    snippet: 'Timestamp(${1:low}, ${2:high})'
  },
  {
    name: 'NumberInt',
    value: 'NumberInt',
    label: 'NumberInt',
    score: 1,
    meta: 'bson',
    version: '0.0.0',
    description: 'BSON 32 bit Integer type',
    snippet: 'NumberInt(${1:value})'
  },
  {
    name: 'NumberLong',
    value: 'NumberLong',
    label: 'NumberLong',
    score: 1,
    meta: 'bson',
    version: '0.0.0',
    description: 'BSON 64 but Integer type',
    snippet: 'NumberLong(${1:value})'
  },
  {
    name: 'NumberDecimal',
    value: 'NumberDecimal',
    label: 'NumberDecimal',
    score: 1,
    meta: 'bson',
    version: '3.4.0',
    description: 'BSON Decimal128 type',
    snippet: "NumberDecimal('${1:value}')"
  },
  {
    name: 'MaxKey',
    value: 'MaxKey',
    label: 'MaxKey',
    score: 1,
    meta: 'bson',
    version: '0.0.0',
    description: 'BSON MaxKey type',
    snippet: 'MaxKey()'
  },
  {
    name: 'MinKey',
    value: 'MinKey',
    label: 'MinKey',
    score: 1,
    meta: 'bson',
    version: '0.0.0',
    description: 'BSON MinKey type',
    snippet: 'MinKey()'
  },
  {
    name: 'ISODate',
    value: 'ISODate',
    label: 'ISODate',
    score: 1,
    meta: 'bson',
    version: '0.0.0',
    description: 'BSON Date type',
    snippet: "ISODate('${1:date}')"
  },
  {
    name: 'RegExp',
    value: 'RegExp',
    label: 'RegExp',
    score: 1,
    meta: 'bson',
    version: '0.0.0',
    description: 'BSON Regex type',
    snippet: "RegExp('${1:source}', '${2:opts}')"
  }
];

export default BSON_TYPES;
