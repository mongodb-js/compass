interface FavoriteQueryStorageClass<T> {
  new (): {
    loadAll(): Promise<T>;
    delete(): Promise<void>;
  };
}

interface PipelineStorageClass<T> {
  new (): {
    loadAll(): Promise<T>;
    delete(): Promise<void>;
  };
}

export function createCompassAggregationsMock(pipelines: unknown[]): {
  PipelineStorage: PipelineStorageClass<typeof pipelines>;
} {
  return {
    PipelineStorage: class PipelineStorageClass {
      loadAll(): Promise<typeof pipelines> {
        return Promise.resolve(pipelines);
      }
      delete(): Promise<void> {
        return Promise.resolve();
      }
    },
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
      delete(): Promise<void> {
        return Promise.resolve();
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
