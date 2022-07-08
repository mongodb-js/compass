import React from 'react';
import { DataServiceManagerProvider } from './services/data-service-manager';
import { CompassLoggingProvider } from './services/logging';
import { SavedAggregationsQueriesProvider } from './services/saved-aggregations-queries';
import { AppRegistryProvider } from './services/app-registry';
import { CompassStoreProvider } from './stores/root-store';

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
} from './stores/saved-aggregations-queries';

export { useDatabases, useDatabaseStats } from './stores/databases';

export {
  useLoadAllCollections,
  useCollectionsForDatabase,
  useCollectionInfo,
  useCollectionStats,
  useCollection,
} from './stores/collections';

export { useConnect } from './stores/current-connection';

export { useLoggingAndTelemetry } from './services/logging';

export { isError, isReady, isLoaded } from './util';
