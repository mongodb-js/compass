import type { IndexDefinition } from 'mongodb-data-service';
import type { InProgressIndex } from '../../src/modules/regular-indexes';

export const indexesList: IndexDefinition[] = [
  {
    name: '_id_',
    version: 2,
    extra: {},
    key: { _id: 1 },
    usageHost: 'computername.local:27017',
    usageCount: 6,
    usageSince: new Date('2019-02-08T10:21:49.176Z'),
    size: 135168,

    type: 'regular',
    cardinality: 'single',
    properties: ['partial', 'ttl'],

    ns: 'foo',
    fields: [],
    relativeSize: 1,
    buildProgress: 0,
  },
  {
    name: 'CCCC',
    version: 2,
    extra: {},
    key: { cccc0: -1, cccc1: '2dsphere', cccc2: 1 },
    usageHost: 'computername.local:27017',
    usageCount: 5,
    usageSince: new Date('2019-02-08T14:38:56.147Z'),
    size: 4096,

    type: 'regular',
    cardinality: 'single',
    properties: ['partial', 'ttl'],

    ns: 'foo',
    fields: [],
    relativeSize: 1,
    buildProgress: 0,
  },
  {
    name: 'AAAA',
    version: 2,
    extra: {},
    key: { aaaa: -1 },
    usageHost: 'computername.local:27017',
    usageCount: 4,
    usageSince: new Date('2019-02-08T14:39:56.285Z'),
    size: 4096,

    type: 'regular',
    cardinality: 'single',
    properties: ['partial', 'ttl'],

    ns: 'foo',
    fields: [],
    relativeSize: 1,
    buildProgress: 0,
  },
  {
    name: 'BBBB',
    version: 2,
    extra: {},
    key: { 'bbbb.abcd': 1 },
    usageHost: 'computername.local:27017',
    usageCount: 10,
    usageSince: new Date('2019-02-08T14:40:13.609Z'),
    size: 94208,

    type: 'regular',
    cardinality: 'single',
    properties: ['partial', 'ttl'],

    ns: 'foo',
    fields: [],
    relativeSize: 1,
    buildProgress: 0,
  },
];

export const defaultSortedIndexes: IndexDefinition[] = [
  {
    ns: 'citibike.trips',
    key: { aaaa: -1 },
    name: 'AAAA',
    size: 4096,
    usageCount: 4,
    usageSince: new Date('2019-02-08T14:39:56.285Z'),
    usageHost: 'computername.local:27017',
    version: 2,
    extra: {
      expireAfterSeconds: 300,
      partialFilterExpression: { y: 1 },
    },
    type: 'regular',
    cardinality: 'single',
    properties: ['partial', 'ttl'],

    fields: [],
    relativeSize: 1,
    buildProgress: 0,
  },
  {
    ns: 'citibike.trips',
    key: { 'bbbb.abcd': 1 },
    name: 'BBBB',
    size: 94208,
    usageCount: 10,
    usageSince: new Date('2019-02-08T14:40:13.609Z'),
    usageHost: 'computername.local:27017',
    version: 2,
    extra: {
      collation: {
        locale: 'ar',
        caseLevel: true,
        caseFirst: 'lower',
        strength: 3,
        numericOrdering: false,
        alternate: 'non-ignorable',
        maxVariable: 'space',
        normalization: true,
        backwards: true,
        version: '57.1',
      },
    },
    type: 'regular',
    cardinality: 'single',
    properties: ['collation'],

    fields: [],
    relativeSize: 1,
    buildProgress: 0,
  },
  {
    ns: 'citibike.trips',
    key: { cccc0: -1, cccc1: '2dsphere', cccc2: 1 },
    name: 'CCCC',
    size: 4096,
    usageCount: 5,
    usageSince: new Date('2019-02-08T14:38:56.147Z'),
    usageHost: 'computername.local:27017',
    version: 2,
    extra: { '2dsphereIndexVersion': 3 },
    type: 'geospatial',
    cardinality: 'compound',
    properties: [],

    fields: [],
    relativeSize: 1,
    buildProgress: 0,
  },
];

export const usageSortedIndexes: IndexDefinition[] = [
  {
    name: 'AAAA',
    usageCount: 4,

    ns: 'citibike.trips',
    key: { aaaa: -1 },
    size: 4096,
    usageSince: new Date('2019-02-08T14:39:56.285Z'),
    usageHost: 'computername.local:27017',
    version: 2,
    extra: {
      expireAfterSeconds: 300,
      partialFilterExpression: { y: 1 },
    },
    type: 'regular',
    cardinality: 'single',
    properties: ['partial', 'ttl'],

    fields: [],
    relativeSize: 1,
    buildProgress: 0,
  },
  {
    name: 'CCCC',
    usageCount: 5,

    ns: 'citibike.trips',
    key: { cccc0: -1, cccc1: '2dsphere', cccc2: 1 },
    size: 4096,
    usageSince: new Date('2019-02-08T14:38:56.147Z'),
    usageHost: 'computername.local:27017',
    version: 2,
    extra: { '2dsphereIndexVersion': 3 },
    type: 'geospatial',
    cardinality: 'compound',
    properties: [],

    fields: [],
    relativeSize: 1,
    buildProgress: 0,
  },
  {
    name: '_id_',
    usageCount: 6,

    ns: 'citibike.trips',
    key: { _id: 1 },
    size: 135168,
    usageSince: new Date('2019-02-08T10:21:49.176Z'),
    usageHost: 'computername.local:27017',
    version: 2,
    extra: {},
    type: 'regular',
    cardinality: 'single',
    properties: ['unique'],

    fields: [],
    relativeSize: 1,
    buildProgress: 0,
  },
  {
    name: 'BBBB',
    usageCount: 10,

    ns: 'citibike.trips',
    key: { 'bbbb.abcd': 1 },
    size: 94208,
    usageSince: new Date('2019-02-08T14:40:13.609Z'),
    usageHost: 'computername.local:27017',
    version: 2,
    extra: {
      collation: {
        locale: 'ar',
        caseLevel: true,
        caseFirst: 'lower',
        strength: 3,
        numericOrdering: false,
        alternate: 'non-ignorable',
        maxVariable: 'space',
        normalization: true,
        backwards: true,
        version: '57.1',
      },
    },
    type: 'regular',
    cardinality: 'single',
    properties: ['collation'],

    fields: [],
    relativeSize: 1,
    buildProgress: 0,
  },
];

export const inProgressIndexes: InProgressIndex[] = [
  {
    id: 'in-progress-1',
    name: 'AAAA',
    //version: 2,
    fields: [],
    status: 'creating',
    buildProgress: 0,
  },
  {
    id: 'in-progress-2',
    name: 'z',
    fields: [
      {
        field: 'z',
        value: 1,
      },
    ],
    status: 'creating',
    buildProgress: 0,
  },
];
