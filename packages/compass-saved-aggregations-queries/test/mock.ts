/* eslint-disable @typescript-eslint/no-unused-vars */
type UpdateAttributes = Record<string, unknown>;
interface FavoriteQueryStorage<T> {
  new (): {
    loadAll(): Promise<T>;
    updateAttributes(id: string, attributes: UpdateAttributes): Promise<void>;
    delete(id: string): Promise<void>;
  };
}

interface PipelineStorageClass<T> {
  new (): {
    loadAll(): Promise<T>;
    updateAttributes(id: string, attributes: UpdateAttributes): Promise<void>;
    delete(id: string): Promise<void>;
  };
}

export function createCompassAggregationsMock(pipelines: unknown[]): {
  PipelineStorage: PipelineStorageClass<typeof pipelines>;
} {
  let data = [...pipelines];
  return {
    PipelineStorage: class PipelineStorageClass {
      loadAll(): Promise<typeof data> {
        return Promise.resolve(data);
      }
      updateAttributes(id: string, attributes: UpdateAttributes): Promise<void> {
        data = data.map((x: any) => {
          if (x.id !== id) {
            return x;
          };
          return {
            ...x,
            ...attributes,
          };
        });
        return Promise.resolve();
      }
      delete(id: string): Promise<void> {
        data = data.filter((x: any) => x.id !== id);
        return Promise.resolve();
      }
    },
  };
}

export function createCompassQueryHistoryMock(queries: unknown[]): {
  FavoriteQueryStorage: FavoriteQueryStorage<typeof queries>;
} {
  let data = [...queries];
  return {
    FavoriteQueryStorage: class FavoriteQueryStorage {
      loadAll(): Promise<typeof data> {
        return Promise.resolve(data);
      }
      updateAttributes(id: string, attributes: UpdateAttributes): Promise<void> {
        data = data.map((x: any) => {
          if (x._id !== id) {
            return x;
          }
          return {
            ...x,
            ...attributes,
          }
        });
        return Promise.resolve();
      }
      delete(id: string): Promise<void> {
        data = data.filter((x: any) => x.id !== id);
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
