import { useEffect } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';
import type { FavoriteQuerySchema, RecentQuerySchema } from './query-storage';
import { FavoriteQueryStorage, RecentQueryStorage } from './query-storage';

let lastId = 0;
const subscriptions = new Map<number, () => void>();
const subscribe = (callback: () => void) => {
  const subscriptionId = lastId++;
  subscriptions.set(subscriptionId, callback);

  return () => subscriptions.delete(subscriptionId);
};

const favoriteStorage = new FavoriteQueryStorage();
const recentsStorage = new RecentQueryStorage();

const state = {
  favoriteQueries: [] as Array<typeof FavoriteQuerySchema>,
  recentQueries: [] as Array<typeof RecentQuerySchema>,
  loaded: false,
};

const setFavoriteQueries = (value: Array<typeof FavoriteQuerySchema>) =>
  (state.favoriteQueries = value as any);
const setRecentQueries = (value: Array<typeof RecentQuerySchema>) =>
  (state.recentQueries = value as any);

const notify = () => {
  for (const cb of subscriptions.values()) {
    cb();
  }
};

export function useSavedQueries() {
  if (!state.loaded) {
    state.loaded = true;

    void favoriteStorage
      .loadAll()
      .then((q) => setFavoriteQueries(q as any))
      .then(notify);
    void recentsStorage
      .loadAll()
      .then((q) => setRecentQueries(q as any))
      .then(notify);
  }

  const favQueriesSnapshot = useSyncExternalStore(
    subscribe,
    () => state.favoriteQueries
  );
  const recentQueriesSnapshot = useSyncExternalStore(
    subscribe,
    () => state.recentQueries
  );

  return {
    favorites: favQueriesSnapshot,
    recents: recentQueriesSnapshot,
    saveFavorite(q: any) {
      void favoriteStorage
        .saveQuery(q)
        .then(() => favoriteStorage.loadAll())
        .then((loadedQueries) => setFavoriteQueries(loadedQueries as any))
        .then(notify);
    },
    saveRecent(q: any) {
      void recentsStorage
        .saveQuery(q)
        .then(() => recentsStorage.loadAll())
        .then((loadedQueries) => setRecentQueries(loadedQueries as any))
        .then(notify);
    },
  };
}
