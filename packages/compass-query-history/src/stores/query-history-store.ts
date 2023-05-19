import type AppRegistry from 'hadron-app-registry';
import { createStore, applyMiddleware } from 'redux';
import type { Store } from 'redux';

import configureFavoriteListStore from './favorite-list-store';
import configureRecentListStore from './recent-list-store';
import { rootReducer as rootQueryHistoryReducer } from '../modules/query-history';
import type { RootState } from '../modules/query-history';

// TODO: Remove these. remove indirection
const FAVORITE_LIST_STORE = 'QueryHistory.FavoriteListStore';
const RECENT_LIST_STORE = 'QueryHistory.RecentListStore';

const configureStore = (options: {
  namespace: string;
  localAppRegistry: AppRegistry;
}): Store<RootState> => {
  const store = createStore(rootQueryHistoryReducer, {
    // TODO
  });

  if (options.namespace) {
    // TODO: store.dispatch(
    // TODO: This is only when the plugin is mounted??
    store.onCollectionChanged(options.namespace);
  }

  if (options.localAppRegistry) {
    const localAppRegistry = options.localAppRegistry;

    // TODO: Do we really need these seperate?

    // Configure all the other stores.
    const favoriteListStore = localAppRegistry.getStore(FAVORITE_LIST_STORE);
    const recentListStore = localAppRegistry.getStore(RECENT_LIST_STORE);

    if (!favoriteListStore.saveFavorite) {
      localAppRegistry.registerStore(
        FAVORITE_LIST_STORE,
        configureFavoriteListStore(options)
      );
    }

    if (!recentListStore.addRecent) {
      localAppRegistry.registerStore(
        RECENT_LIST_STORE,
        configureRecentListStore(options)
      );
    }

    store.localAppRegistry = localAppRegistry;
  }

  return store;
};

export { configureStore };
