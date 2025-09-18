// Main exports - these use runtime detection for backward compatibility
export {
  createWebRecentQueryStorage,
  createWebFavoriteQueryStorage,
  createWebPipelineStorage,
  createElectronRecentQueryStorage,
  createElectronFavoriteQueryStorage,
  createElectronPipelineStorage,
} from './storage-factories';

export type {
  WebStorageOptions,
  ElectronStorageOptions,
} from './storage-factories';

// Re-export shared interfaces
export type {
  RecentQueryStorageInterface,
  FavoriteQueryStorageInterface,
  PipelineStorageInterface,
} from './storage-interfaces';

// Re-export schemas
export type { RecentQuery, FavoriteQuery } from './query-storage-schema';
export type { SavedPipeline } from './pipeline-storage-schema';

// Re-export provider types
export type {
  FavoriteQueryStorageAccess,
  RecentQueryStorageAccess,
  PipelineStorageAccess,
} from './provider';
