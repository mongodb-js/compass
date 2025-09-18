// Electron-specific exports for Compass Electron
export {
  createElectronRecentQueryStorage,
  createElectronFavoriteQueryStorage,
  createElectronPipelineStorage,
} from './storage-factories';

export type { ElectronStorageOptions } from './storage-factories';

// Re-export shared interfaces
export type {
  RecentQueryStorageInterface,
  FavoriteQueryStorageInterface,
  PipelineStorageInterface,
} from './storage-interfaces';

// Re-export schemas
export type { RecentQuery, FavoriteQuery } from './query-storage-schema';
export type { SavedPipeline } from './pipeline-storage-schema';
