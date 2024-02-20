import { createContext, useContext } from 'react';
import type { QueryStorageOptions } from './compass-query-storage';
import type { PipelineStorage } from './pipeline-storage';
import type { FavoriteQueryStorage, RecentQueryStorage } from './query-storage';

export type { PipelineStorage, FavoriteQueryStorage, RecentQueryStorage };

export type FavoriteQueryStorageAccess = {
  getStorage(options?: QueryStorageOptions): FavoriteQueryStorage;
};

export type RecentQueryStorageAccess = {
  getStorage(options?: QueryStorageOptions): RecentQueryStorage;
};

const PipelineStorageContext = createContext<PipelineStorage | undefined>(
  undefined
);
const FavoriteQueryStorageContext = createContext<
  FavoriteQueryStorageAccess | undefined
>(undefined);
const RecentQueryStorageContext = createContext<
  RecentQueryStorageAccess | undefined
>(undefined);

export const PipelineStorageProvider = PipelineStorageContext.Provider;
export const FavoriteQueryStorageProvider =
  FavoriteQueryStorageContext.Provider;
export const RecentQueryStorageProvider = RecentQueryStorageContext.Provider;

export const usePipelineStorage = () => useContext(PipelineStorageContext);
export const pipelineStorageLocator = usePipelineStorage;

export const useFavoriteQueryStorageAccess = () =>
  useContext(FavoriteQueryStorageContext);
export const favoriteQueryStorageAccessLocator = useFavoriteQueryStorageAccess;

export const useRecentQueryStorageAccess = () =>
  useContext(RecentQueryStorageContext);
export const recentQueryStorageAccessLocator = useRecentQueryStorageAccess;
