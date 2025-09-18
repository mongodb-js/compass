// Electron-specific exports for Compass Electron
export {
  ElectronCompassRecentQueryStorage,
  ElectronCompassFavoriteQueryStorage,
} from './compass-query-storage-electron';
export { ElectronCompassPipelineStorage } from './compass-pipeline-storage-electron';

export type { ElectronQueryStorageOptions } from './compass-query-storage-electron';
export type { ElectronPipelineStorageOptions } from './compass-pipeline-storage-electron';

// Re-export shared interfaces
export type {
  RecentQueryStorageInterface,
  FavoriteQueryStorageInterface,
  PipelineStorageInterface,
} from './storage-interfaces';

// Re-export schemas
export type { RecentQuery, FavoriteQuery } from './query-storage-schema';
export type { SavedPipeline } from './pipeline-storage-schema';
