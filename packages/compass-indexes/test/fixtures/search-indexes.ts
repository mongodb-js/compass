import type { SearchIndex } from 'mongodb-data-service';
export const searchIndexes: SearchIndex[] = [
  {
    id: '1',
    name: 'default',
    status: 'READY',
    queryable: true,
    latestDefinition: {
      mappings: {
        dynamic: false,
      },
    },
  },
  {
    id: '2',
    name: 'another',
    status: 'FAILED',
    queryable: false,
    latestDefinition: {},
  },
];
