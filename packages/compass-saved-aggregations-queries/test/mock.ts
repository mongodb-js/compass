export function createCompassAggregationsMock(pipelines: unknown[]): {
  readPipelinesFromStorage(): Promise<typeof pipelines>;
} {
  return {
    readPipelinesFromStorage(): Promise<typeof pipelines> {
      return Promise.resolve(pipelines);
    },
  };
}

interface FavoriteQueryStorageClass<T> {
  new (): {
    loadAll(): Promise<T>;
  };
}

export function createCompassQueryHistoryMock(queries: unknown[]): {
  FavoriteQueryStorage: FavoriteQueryStorageClass<typeof queries>;
} {
  return {
    FavoriteQueryStorage: class FavoriteQueryStorage {
      loadAll(): Promise<typeof queries> {
        return Promise.resolve(queries);
      }
    },
  };
}

export function createProxyquireMockForQueriesAndAggregationsPlugins(
  pipelines: unknown[],
  queries: unknown[]
): unknown {
  return {
    '@mongodb-js/compass-query-history': {
      ...createCompassQueryHistoryMock(queries),
      '@global': true,
      '@noCallThru': true,
    },
    '@mongodb-js/compass-aggregations': {
      ...createCompassAggregationsMock(pipelines),
      '@global': true,
      '@noCallThru': true,
    },
  };
}
