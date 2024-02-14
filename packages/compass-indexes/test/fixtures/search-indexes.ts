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

export const vectorSearchIndexes: SearchIndex[] = [
  {
    id: '1',
    name: 'vectorSearching123',
    status: 'READY',
    type: 'vectorSearch',
    queryable: true,
    latestDefinition: {
      fields: [
        {
          type: 'vector',
          path: 'plot_embedding',
          numDimensions: 1536,
          similarity: 'euclidean',
        },
        {
          type: 'filter',
          path: 'genres',
        },
      ],
    },
  },
  {
    id: '2',
    name: 'pineapple',
    status: 'FAILED',
    type: 'vectorSearch',
    queryable: false,
    latestDefinition: {},
  },
];
