import type { SearchIndex } from 'mongodb-data-service';
import type { RegularIndex } from '../src/modules/regular-indexes';

export function mockRegularIndex(info: Partial<RegularIndex>): RegularIndex {
  return {
    ns: 'test.test',
    name: '_id_1',
    type: 'regular',
    key: {},
    fields: [],
    size: 0,
    relativeSize: 0,
    cardinality: 'single',
    properties: [],
    ...info,
    extra: {
      ...info.extra,
    },
  };
}

export function mockSearchIndex(info: Partial<SearchIndex>): SearchIndex {
  return {
    id: 'a',
    name: 'test',
    status: 'READY',
    queryable: true,
    ...info,
    latestDefinition: {
      ...info.latestDefinition,
    },
  };
}
