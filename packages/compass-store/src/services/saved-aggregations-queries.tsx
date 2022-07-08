import React, { createContext, useRef, useContext } from 'react';
import type { FileMetadata, PersistentStorage } from './persistent-storage';
import { PersistentStorageService } from './persistent-storage';
import toNS from 'mongodb-ns';

type QueryItemCommonProps = {
  _id: string;
  filter: Record<string, unknown>;
  project?: Record<string, unknown>;
  sort?: Record<string, number> | [string, number][];
  skip?: number;
  limit?: number;
  collation?: Record<string, unknown>;
  _lastExecuted: Date;
  _ns: string;
  _host?: string | null;
};

type FavouriteQueryExtraProps = {
  _name: string;
  _dateSaved: Date;
  _dateModified: Date;
};

type RecentQueryItem = QueryItemCommonProps &
  { [key in keyof FavouriteQueryExtraProps]?: never };

type FavouriteQueryItem = QueryItemCommonProps & FavouriteQueryExtraProps;

type StoredQueryItem = RecentQueryItem | FavouriteQueryItem;

// TODO: We need way less stuff stored on disk actually, but this would require
// updating aggrgation plugin store first
type AggregationPipelineItem = {
  id: string;
  stageOperator: string;
  stage: string;
  isValid: boolean;
  isEnabled: boolean;
  isExpanded: boolean;
  isLoading: boolean;
  isComplete: boolean;
  syntaxError: string | null;
  error: string | null;
  projections: unknown[];
  fromStageOperators: boolean;
  executor: unknown;
  snippet: string;
};

type StoredAggregationItem = {
  // NB: These are actually stored with id, not _id, we will adjust on read and
  // can add a migration to make it consistent with all the other stored items
  _id: string;
  id?: string;
  name: string;
  namespace: string;
  comments: boolean;
  sample: boolean;
  autoPreview: boolean;
  collationString: string;
  pipeline: AggregationPipelineItem[];
  host?: string | null;
};

type AggregationQueryCommonProps = FileMetadata & {
  id: string;
  name: string;
  database: string;
  collection: string;
  updatedAt: number;
  createdAt: number;
  host: string | null;
};

export type AggregationItem = AggregationQueryCommonProps & {
  type: 'aggregation';
  aggregation: StoredAggregationItem;
};

export type QueryItem = AggregationQueryCommonProps & {
  type: 'query';
  query: StoredQueryItem;
};

export type AggregationQueryItem = AggregationItem | QueryItem;

export interface SavedAggregationsQueriesService {
  load(): Promise<AggregationQueryItem[]>;
  save(items: AggregationQueryItem | AggregationQueryItem[]): Promise<void>;
  delete(ids: string | string[]): Promise<void>;
}

/**
 * TODO: We totally should run a migration and simplify all this code here
 *
 * @internal
 */
export class SavedAggregationsQueriesServiceImpl
  implements SavedAggregationsQueriesService
{
  private storageService: PersistentStorage;
  private recentQueriesCollection = 'RecentQueries';
  private favouriteQueriesCollection = 'FavoriteQueries';
  private savedAggregationsCollection = 'SavedPipelines';

  constructor(storageService = new PersistentStorageService()) {
    this.storageService = storageService;
  }

  async load(): Promise<AggregationQueryItem[]> {
    const items = await Promise.all([
      this.storageService
        .readCollectionFromFS<StoredQueryItem>(this.recentQueriesCollection)
        .then((items) => items.map((item) => this.storedQueryToItem(item))),

      this.storageService
        .readCollectionFromFS<StoredQueryItem>(this.favouriteQueriesCollection)
        .then((items) => items.map((item) => this.storedQueryToItem(item))),

      this.storageService
        .readCollectionFromFS<StoredAggregationItem>(
          this.savedAggregationsCollection,
          (input) => {
            input._id ??= input.id;
            return input;
          }
        )
        .then((items) =>
          items.map((item) => this.storedAggregationToItem(item))
        ),
    ]);

    return items.flat().sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async save(
    items: AggregationQueryItem | AggregationQueryItem[]
  ): Promise<void> {
    items = Array.isArray(items) ? items : [items];

    const [recentQueries, favouriteQueries, savedAggregations] = items.reduce(
      (acc, item) => {
        if (item.type === 'query') {
          if (item.id.startsWith(this.recentQueriesCollection)) {
            acc[0].push(item);
          } else {
            acc[1].push(item);
          }
        } else {
          acc[2].push(item);
        }
        return acc;
      },
      [[], [], []] as [QueryItem[], QueryItem[], AggregationItem[]]
    );

    await Promise.all([
      this.storageService.writeCollectionToFS(
        this.recentQueriesCollection,
        recentQueries.map((item) => this.itemToStoredQuery(item))
      ),

      this.storageService.writeCollectionToFS(
        this.favouriteQueriesCollection,
        favouriteQueries.map((item) => this.itemToStoredQuery(item))
      ),

      this.storageService.writeCollectionToFS(
        this.savedAggregationsCollection,
        savedAggregations.map((item) => this.itemToStoredAggregation(item))
      ),
    ]);
  }

  async delete(ids: string | string[]): Promise<void> {
    ids = Array.isArray(ids) ? ids : [ids];

    const [recentQueries, favouriteQueries, savedAggregations] = ids.reduce(
      (acc, id) => {
        const [prefix, realId] = id.split('::');
        if (prefix === this.recentQueriesCollection) {
          acc[0].push(realId);
        } else if (prefix === this.favouriteQueriesCollection) {
          acc[1].push(realId);
        } else if (prefix === this.savedAggregationsCollection) {
          acc[2].push(realId);
        }
        return acc;
      },
      [[], [], []] as [string[], string[], string[]]
    );

    await Promise.all(
      [
        recentQueries.map((id) => {
          return this.storageService.removeItemFromFS(
            this.recentQueriesCollection,
            id
          );
        }),

        favouriteQueries.map((id) => {
          return this.storageService.removeItemFromFS(
            this.favouriteQueriesCollection,
            id
          );
        }),

        savedAggregations.map((id) => {
          return this.storageService.removeItemFromFS(
            this.savedAggregationsCollection,
            id
          );
        }),
      ].flat()
    );
  }

  private storedQueryToItem(
    storedItem: StoredQueryItem & FileMetadata
  ): QueryItem {
    const { database, collection } = toNS(storedItem._ns);
    return {
      id: `${
        storedItem._name
          ? this.favouriteQueriesCollection
          : this.recentQueriesCollection
      }::${storedItem._id}`,
      name: storedItem._name ?? '',
      host: storedItem._host ?? null,
      type: 'query',
      query: storedItem,
      database,
      collection,
      updatedAt: storedItem.updatedAt,
      createdAt: storedItem.createdAt,
    };
  }

  private storedAggregationToItem(
    storedItem: StoredAggregationItem & FileMetadata
  ): AggregationItem {
    const { database, collection } = toNS(storedItem.namespace);
    return {
      id: `${this.savedAggregationsCollection}::${storedItem._id}`,
      name: storedItem.name,
      host: storedItem.host ?? null,
      type: 'aggregation',
      aggregation: storedItem,
      database,
      collection,
      createdAt: storedItem.createdAt,
      updatedAt: storedItem.updatedAt,
    };
  }

  private itemToStoredQuery(item: QueryItem): StoredQueryItem {
    if (item.query._name) {
      return {
        ...item.query,
        _name: item.name,
        _host: item.host,
      };
    }
    return item.query;
  }

  private itemToStoredAggregation(
    item: AggregationItem
  ): StoredAggregationItem {
    return {
      ...item.aggregation,
      name: item.name,
      host: item.host,
    };
  }
}

const SavedAggregationsQueriesServiceContext =
  createContext<SavedAggregationsQueriesService | null>(null);

export const SavedAggregationsQueriesProvider: React.FunctionComponent<{
  service?: SavedAggregationsQueriesService;
}> = ({ service, children }) => {
  const _service = useRef<SavedAggregationsQueriesService | null>(null);
  if (!_service.current) {
    _service.current = service ?? new SavedAggregationsQueriesServiceImpl();
  }
  return (
    <SavedAggregationsQueriesServiceContext.Provider value={_service.current}>
      {children}
    </SavedAggregationsQueriesServiceContext.Provider>
  );
};

/**
 * @internal
 */
export const useSavedAggregationsQueriesService =
  (): SavedAggregationsQueriesService => {
    const service = useContext(SavedAggregationsQueriesServiceContext);
    if (!service) {
      throw new Error('Expected to find service in React context');
    }
    return service;
  };
