import { createContext, useContext, useRef } from 'react';
import type { PipelineStorage } from './pipeline-storage';
import type { FavoriteQueryStorage, RecentQueryStorage } from './query-storage';

const PipelineStorageContext = createContext<PipelineStorage | null>(null);
const FavoriteQueryStorageContext = createContext<{
  createStorage: (
    ...options: ConstructorParameters<typeof FavoriteQueryStorage>
  ) => FavoriteQueryStorage;
} | null>(null);
const RecentQueryStorageContext = createContext<{
  createStorage: (
    ...options: ConstructorParameters<typeof RecentQueryStorage>
  ) => RecentQueryStorage;
} | null>(null);

export const PipelineStorageProvider = PipelineStorageContext.Provider;
export const FavoriteQueryStorageProvider =
  FavoriteQueryStorageContext.Provider;
export const RecentQueryStorageContextProvider =
  RecentQueryStorageContext.Provider;

export const pipelineStorageLocator = (): PipelineStorage => {
  const pipelineStorage = useContext(PipelineStorageContext);
  if (!pipelineStorage) {
    throw new Error('No PipelineStorage available in this context');
  }
  return pipelineStorage;
};

export const createFavoriteQueryStorageLocator =
  () =>
  (
    ...options: ConstructorParameters<typeof FavoriteQueryStorage>
  ): FavoriteQueryStorage => {
    const context = useContext(FavoriteQueryStorageContext);
    if (!context) {
      throw new Error('No FavoriteQueryStorage available in this context');
    }

    const storageRef = useRef<Map<string, FavoriteQueryStorage>>(new Map());
    const key = JSON.stringify(options);
    const queryStorage = storageRef.current.get(key);
    if (!queryStorage) {
      const favoriteQueryStorage = context.createStorage(...options);
      storageRef.current.set(key, favoriteQueryStorage);
      return favoriteQueryStorage;
    }

    return queryStorage;
  };

export const createRecentQueryStorageLocator =
  () =>
  (
    ...options: ConstructorParameters<typeof RecentQueryStorage>
  ): RecentQueryStorage => {
    const context = useContext(RecentQueryStorageContext);
    if (!context) {
      throw new Error('No RecentQueryStorage available in this context');
    }

    const storageRef = useRef<Map<string, RecentQueryStorage>>(new Map());
    const key = JSON.stringify(options);
    const queryStorage = storageRef.current.get(key);
    if (!queryStorage) {
      const recentQueryStorage = context.createStorage(...options);
      storageRef.current.set(key, recentQueryStorage);
      return recentQueryStorage;
    }

    return queryStorage;
  };
