import { createContext, useContext } from 'react';
import type { QueryStorageOptions } from './compass-query-storage';
import type { PipelineStorage } from './pipeline-storage';
import type { FavoriteQueryStorage, RecentQueryStorage } from './query-storage';
import { createServiceLocator } from '@mongodb-js/compass-app-registry';

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
export const pipelineStorageLocator = createServiceLocator(
  usePipelineStorage,
  'pipelineStorageLocator'
);

export const useFavoriteQueryStorageAccess = () =>
  useContext(FavoriteQueryStorageContext);
export const favoriteQueryStorageAccessLocator = createServiceLocator(
  useFavoriteQueryStorageAccess,
  'favoriteQueryStorageAccessLocator'
);

export const useRecentQueryStorageAccess = () =>
  useContext(RecentQueryStorageContext);
export const recentQueryStorageAccessLocator = createServiceLocator(
  useRecentQueryStorageAccess,
  'recentQueryStorageAccessLocator'
);
