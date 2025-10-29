// Web-specific exports for Compass Web
export {
  createWebRecentQueryStorage,
  createWebFavoriteQueryStorage,
  createWebPipelineStorage,
} from './storage-factories';

export type { WebStorageOptions } from './storage-factories';

// Re-export shared interfaces
export type {
  RecentQueryStorageInterface,
  FavoriteQueryStorageInterface,
  PipelineStorageInterface,
} from './storage-interfaces';

// Re-export schemas
export type { RecentQuery, FavoriteQuery } from './query-storage-schema';
export type { SavedPipeline } from './pipeline-storage-schema';
