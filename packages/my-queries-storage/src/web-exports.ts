// Web-specific exports for Compass Web
export {
  WebCompassRecentQueryStorage,
  WebCompassFavoriteQueryStorage,
} from './compass-query-storage-web';
export { WebCompassPipelineStorage } from './compass-pipeline-storage-web';

export type { WebQueryStorageOptions } from './compass-query-storage-web';
export type { WebPipelineStorageOptions } from './compass-pipeline-storage-web';

// Re-export shared interfaces
export type {
  RecentQueryStorageInterface,
  FavoriteQueryStorageInterface,
  PipelineStorageInterface,
} from './storage-interfaces';

// Re-export schemas
export type { RecentQuery, FavoriteQuery } from './query-storage-schema';
export type { SavedPipeline } from './pipeline-storage-schema';
