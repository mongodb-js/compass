import type { Query } from '@mongodb-js/compass-query-history';
import type { StoredPipeline } from '@mongodb-js/compass-aggregations';

type UpdateAttributes = Record<string, unknown>;
interface FavoriteQueryStorage {
  new (): {
    loadAll(): Promise<Query[]>;
    updateAttributes(id: string, attributes: UpdateAttributes): Promise<Query>;
    delete(id: string): Promise<void>;
  };
}

interface PipelineStorageClass {
  new (): {
    loadAll(): Promise<StoredPipeline[]>;
    updateAttributes(
      id: string,
      attributes: UpdateAttributes
    ): Promise<StoredPipeline>;
    delete(id: string): Promise<void>;
  };
}

export function createCompassAggregationsMock(aggregations: StoredPipeline[]): {
  PipelineStorage: PipelineStorageClass;
} {
  let data = [...aggregations];
  return {
    PipelineStorage: class PipelineStorageClass {
      loadAll(): Promise<typeof data> {
        return Promise.resolve(data);
      }
      updateAttributes(
        id: string,
        attributes: UpdateAttributes
      ): Promise<StoredPipeline> {
        const index = data.findIndex((x) => x.id === id);
        if (index >= 0) {
          data[index] = {
            ...data[index],
            ...attributes,
          };
          return Promise.resolve(data[index]);
        }
        throw new Error('Can not find pipeline');
      }
      delete(id: string): Promise<void> {
        data = data.filter((x: StoredPipeline) => x.id !== id);
        return Promise.resolve();
      }
    },
  };
}

export function createCompassQueryHistoryMock(queries: Query[]): {
  FavoriteQueryStorage: FavoriteQueryStorage;
} {
  let data = [...queries];
  return {
    FavoriteQueryStorage: class FavoriteQueryStorage {
      loadAll(): Promise<typeof data> {
        return Promise.resolve(data);
      }
      updateAttributes(
        id: string,
        attributes: UpdateAttributes
      ): Promise<Query> {
        const index = data.findIndex((x) => x._id === id);
        if (index >= 0) {
          data[index] = {
            ...data[index],
            ...attributes,
          };
          return Promise.resolve(data[index]);
        }
        throw new Error('Can not find query');
      }
      delete(id: string): Promise<void> {
        data = data.filter((x: Query) => x._id !== id);
        return Promise.resolve();
      }
    },
  };
}

export function createProxyquireMockForQueriesAndAggregationsPlugins(
  pipelines: StoredPipeline[],
  queries: Query[]
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
