import type AppRegistry from 'hadron-app-registry';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import type { Store } from 'redux';
import mongodbns from 'mongodb-ns';
import type { DataService } from 'mongodb-data-service';

import { rootReducer as rootQueryHistoryReducer } from '../modules/query-history';
import type { RootState } from '../modules/query-history';

const configureStore = (options: {
  namespace: string;
  localAppRegistry: AppRegistry;
  dataProvider?: {
    dataProvider: DataService;
  };
}): Store<RootState> => {
  return createStore(
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
};

export { configureStore };
