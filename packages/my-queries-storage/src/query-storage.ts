import type { z } from '@mongodb-js/compass-user-data';
import type {
  FavoriteQuerySchema,
  RecentQuerySchema,
} from './query-storage-schema';

interface QueryStorage<T extends typeof RecentQuerySchema> {
  loadAll(namespace?: string): Promise<z.output<T>[]>;
  updateAttributes(id: string, data: Partial<z.input<T>>): Promise<boolean>;
  delete(id: string): Promise<boolean>;
}

export interface RecentQueryStorage
  extends QueryStorage<typeof RecentQuerySchema> {
  saveQuery(
    data: Omit<z.input<typeof RecentQuerySchema>, '_id' | '_lastExecuted'>
  ): Promise<void>;
}

export interface FavoriteQueryStorage
  extends QueryStorage<typeof FavoriteQuerySchema> {
  saveQuery(
    data: Omit<
      z.input<typeof FavoriteQuerySchema>,
      '_id' | '_lastExecuted' | '_dateModified' | '_dateSaved'
    >
  ): Promise<void>;
}
