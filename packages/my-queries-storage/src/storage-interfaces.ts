import { type z } from '@mongodb-js/compass-user-data';
import type { RecentQuery, FavoriteQuery } from './query-storage-schema';
import type { SavedPipeline } from './pipeline-storage-schema';

// Shared interfaces for query storage
export interface QueryStorageInterface<TSchema extends z.Schema> {
  loadAll(namespace?: string): Promise<z.output<TSchema>[]>;
  write(id: string, content: z.input<TSchema>): Promise<boolean>;
  delete(id: string): Promise<boolean>;
  updateAttributes(
    id: string,
    data: Partial<z.input<TSchema>>
  ): Promise<boolean>;
}

export interface RecentQueryStorageInterface
  extends QueryStorageInterface<
    typeof import('./query-storage-schema').RecentQuerySchema
  > {
  saveQuery(data: Omit<RecentQuery, '_id' | '_lastExecuted'>): Promise<void>;
}

export interface FavoriteQueryStorageInterface
  extends QueryStorageInterface<
    typeof import('./query-storage-schema').FavoriteQuerySchema
  > {
  saveQuery(
    data: Omit<
      FavoriteQuery,
      '_id' | '_lastExecuted' | '_dateModified' | '_dateSaved'
    >,
    _id?: string
  ): Promise<void>;
}

// Shared interface for pipeline storage
export interface PipelineStorageInterface {
  loadAll(): Promise<SavedPipeline[]>;
  loadMany(
    predicate: (arg0: SavedPipeline) => boolean
  ): Promise<SavedPipeline[]>;
  createOrUpdate(
    id: string,
    attributes: Omit<SavedPipeline, 'lastModified'>
  ): Promise<boolean>;
  create(data: Omit<SavedPipeline, 'lastModified'>): Promise<boolean>;
  updateAttributes(
    id: string,
    attributes: Partial<SavedPipeline>
  ): Promise<boolean>;
  delete(id: string): Promise<void>;
}
