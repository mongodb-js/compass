import {
  CompassFavoriteQueryStorage,
  CompassRecentQueryStorage,
} from './compass-query-storage';
import type {
  FavoriteQueryStorageAccess,
  RecentQueryStorageAccess,
} from './provider';

export type { SavedPipeline } from './pipeline-storage-schema';
export { CompassPipelineStorage } from './compass-pipeline-storage';
export {
  CompassFavoriteQueryStorage,
  CompassRecentQueryStorage,
} from './compass-query-storage';
export type { RecentQuery, FavoriteQuery } from './query-storage-schema';

// Export providers for use in applications
export {
  FavoriteQueryStorageProvider,
  RecentQueryStorageProvider,
  PipelineStorageProvider,
} from '@mongodb-js/my-queries-storage/provider';

// These are exported to aid in testing
export const compassFavoriteQueryStorageAccess: FavoriteQueryStorageAccess = {
  getStorage() {
    return new CompassFavoriteQueryStorage();
  },
};

export const compassRecentQueryStorageAccess: RecentQueryStorageAccess = {
  getStorage() {
    return new CompassRecentQueryStorage();
  },
};
