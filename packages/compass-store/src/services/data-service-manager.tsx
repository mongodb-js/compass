import React from 'react';
import { connect } from 'mongodb-data-service';
import type { DataService as _DataService } from 'mongodb-data-service';
import { createContext, useContext, useRef } from 'react';

// NB: Only expose methods that we are using
export type DataService = Pick<
  _DataService,
  | 'getConnectionString'
  | 'getConnectionOptions'
  | 'instance'
  | 'listDatabases'
  | 'databaseStats'
  | 'listCollections'
  | 'collectionInfo'
  | 'collectionStatsAsync'
>;

export interface DataServiceManager {
  connect: typeof connect;
  getCurrentConnection(): Promise<DataService>;
}

/**
 * Allows to create static context that will manage keeping reference to the
 * actual dataService instance that will be created only when Compass connects
 *
 * @internal
 */
export class DataServiceManagerImpl implements DataServiceManager {
  private currentConnectionPromise: Promise<DataService> | null = null;
  connect = (
    ...args: Parameters<typeof connect>
  ): ReturnType<typeof connect> => {
    return (this.currentConnectionPromise = connect(...args));
  };
  getCurrentConnection(): Promise<DataService> {
    if (!this.currentConnectionPromise) {
      throw new Error('No connection established');
    }
    return this.currentConnectionPromise;
  }
}

const DataServiceManagerContext = createContext<DataServiceManager | null>(
  null
);

export const DataServiceManagerProvider: React.FunctionComponent<{
  service?: DataServiceManager;
}> = ({ service, children }) => {
  const _service = useRef<DataServiceManager>();
  if (!_service.current) {
    _service.current = service ?? new DataServiceManagerImpl();
  }
  return (
    <DataServiceManagerContext.Provider value={_service.current}>
      {children}
    </DataServiceManagerContext.Provider>
  );
};

/**
 * @internal
 */
export const useDataServiceManager = (): DataServiceManager => {
  const service = useContext(DataServiceManagerContext);
  if (!service) {
    throw new Error('Expected to find service in React context');
  }
  return service;
};
