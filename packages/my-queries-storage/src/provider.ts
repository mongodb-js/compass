import { usePreference } from 'compass-preferences-model/provider';
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

export const pipelineStorageLocator = (): PipelineStorage | undefined => {
  const storageIsRequired = usePreference('enableSavedAggregationsQueries');
  const pipelineStorage = useContext(PipelineStorageContext);
  if (storageIsRequired && !pipelineStorage) {
    throw new Error('No PipelineStorage available in this context');
  }

  return pipelineStorage;
};

export const favoriteQueryStorageAccessLocator = ():
  | FavoriteQueryStorageAccess
  | undefined => {
  const storageIsRequired = usePreference('enableSavedAggregationsQueries');
  const storageAccess = useContext(FavoriteQueryStorageContext);
  if (storageIsRequired && !storageAccess) {
    throw new Error('No FavoriteQueryStorageAccess available in this context');
  }

  return storageAccess;
};

export const recentQueryStorageAccessLocator = ():
  | RecentQueryStorageAccess
  | undefined => {
  const storageIsRequired = usePreference('enableSavedAggregationsQueries');
  const storageAccess = useContext(RecentQueryStorageContext);
  if (storageIsRequired && !storageAccess) {
    throw new Error('No RecentQueryStorageAccess available in this context');
  }

  return storageAccess;
};
