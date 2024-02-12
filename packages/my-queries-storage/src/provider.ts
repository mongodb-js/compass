import { createContext, useContext } from 'react';
import type { PipelineStorage } from './pipeline-storage';
import type {
  FavoriteQueryStorage,
  RecentQueryStorage,
  QueryStorageOptions,
} from './query-storage';

export type FavoriteQueryStorageAccess = {
  createStorage(options?: QueryStorageOptions): FavoriteQueryStorage;
};

export type RecentQueryStorageAccess = {
  createStorage(options?: QueryStorageOptions): RecentQueryStorage;
};

const PipelineStorageContext = createContext<PipelineStorage | null>(null);
const FavoriteQueryStorageContext =
  createContext<FavoriteQueryStorageAccess | null>(null);
const RecentQueryStorageContext =
  createContext<RecentQueryStorageAccess | null>(null);

export const PipelineStorageProvider = PipelineStorageContext.Provider;
export const FavoriteQueryStorageProvider =
  FavoriteQueryStorageContext.Provider;
export const RecentQueryStorageProvider = RecentQueryStorageContext.Provider;

export const pipelineStorageLocator = (): PipelineStorage => {
  const pipelineStorage = useContext(PipelineStorageContext);
  if (!pipelineStorage) {
    throw new Error('No PipelineStorage available in this context');
  }
  return pipelineStorage;
};

export const favoriteQueryStorageAccessLocator =
  (): FavoriteQueryStorageAccess => {
    const favoriteQueryStorageAccess = useContext(FavoriteQueryStorageContext);
    if (!favoriteQueryStorageAccess) {
      throw new Error('No FavoriteQueryStorage available in this context');
    }
    return favoriteQueryStorageAccess;
  };

export const recentQueryStorageAccessLocator = (): RecentQueryStorageAccess => {
  const recentQueryStorageAccess = useContext(RecentQueryStorageContext);
  if (!recentQueryStorageAccess) {
    throw new Error('No RecentQueryStorage available in this context');
  }
  return recentQueryStorageAccess;
};
