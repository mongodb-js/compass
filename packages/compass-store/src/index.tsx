import React from 'react';
import { DataServiceManagerProvider } from './services/data-service-manager';
import { CompassLoggingProvider } from './services/logging';
import { SavedAggregationsQueriesProvider } from './services/saved-aggregations-queries';
import { AppRegistryProvider } from './services/app-registry';

// import { CompassStoreProvider } from './redux/root-store';
// export { useDatabases, useDatabasesIds, useSortedDatabaseIds, useDatabaseStats } from './redux/databases';
// export { useConnect } from './redux/current-connection';
// export {
//   useLoadAllCollections,
//   useCollectionsForDatabase,
//   useCollectionIdsForDatabase,
//   useCollectionInfo,
//   useCollectionStats,
//   useListedCollection,
// } from './redux/collections';

import { CompassStoreProvider } from './mobx-state-tree/root-store';
export { useDatabases, useDatabaseStats } from './mobx-state-tree/databases';
export { useConnect } from './mobx-state-tree/current-connection';
export {
  useCollectionsForDatabase,
  useCollectionInfo,
  useCollectionStats,
  useListedCollection,
} from './mobx-state-tree/collections';

function combineProviders(
  ...providers: React.ComponentType[]
): React.ComponentType {
  return function CombinedProvider({ children }) {
    return (
      <>
        {providers.reduce(function Provider(child, Provider) {
          return <Provider>{child}</Provider>;
        }, children)}
      </>
    );
  };
}

const ServiceProvider = combineProviders(
  SavedAggregationsQueriesProvider,
  DataServiceManagerProvider,
  CompassLoggingProvider,
  AppRegistryProvider
);

export {
  ServiceProvider,
  DataServiceManagerProvider,
  SavedAggregationsQueriesProvider,
  CompassLoggingProvider,
  CompassStoreProvider,
  AppRegistryProvider,
};

export type {
  AggregationQueryItem,
  AggregationItem,
  QueryItem,
} from './services/saved-aggregations-queries';

export {
  useSavedAggregationsQueriesItems,
  useSavedQueries,
  useFavoriteQueries,
  useRecentQueries,
  useSavedAggregations,
  useDeleteSavedItem,
} from './redux/saved-aggregations-queries';

export type {
  Database,
  Databases,
  DatabaseStats,
} from './mobx-state-tree/databases';

export { useLoggingAndTelemetry } from './services/logging';

export { isError, isReady, isLoaded } from './util';

export { observer } from 'mobx-react-lite';
