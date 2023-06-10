import type AppRegistry from 'hadron-app-registry';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import type { Store, AnyAction } from 'redux';
import mongodbns from 'mongodb-ns';
import type { DataService } from 'mongodb-data-service';

import { rootReducer as rootQueryHistoryReducer } from '../modules/query-history';
import type { RootState } from '../modules/query-history';
import { loadFavoriteQueries } from '../modules/favorite-queries';
import { addRecent, loadRecentQueries } from '../modules/recent-queries';

const configureStore = (options: {
  namespace: string;
  localAppRegistry: AppRegistry;
  dataProvider?: {
    dataProvider: DataService;
  };
}): Store<RootState> => {
  const store = createStore(
    rootQueryHistoryReducer,
    {
      queryHistory: {
        ns: mongodbns(options.namespace),
        localAppRegistry: options.localAppRegistry,
        currentHost: options.dataProvider?.dataProvider
          ?.getConnectionString?.()
          .hosts.join(','),
        showing: 'recent',
      },
    },
    applyMiddleware(thunk)
  );

  options.localAppRegistry.on('query-applied', (query) => {
    store.dispatch(addRecent(query) as unknown as AnyAction);
  });

  store.dispatch(loadRecentQueries() as unknown as AnyAction),
    store.dispatch(loadFavoriteQueries() as unknown as AnyAction);

  return store;
};

export { configureStore };
