import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import type {
  DataModelStorage,
  MongoDBDataModelDescription,
} from '../services/data-model-storage';
import { createServiceLocator } from 'hadron-app-registry';

type DataModelStorageServiceState = {
  status: 'INITIAL' | 'LOADING' | 'REFRESHING' | 'READY' | 'ERROR';
  error: Error | null;
  items: MongoDBDataModelDescription[];
};

const noopDataModelStorageService: DataModelStorageServiceState &
  DataModelStorage = {
  status: 'INITIAL',
  error: null,
  items: [],
  save: () => {
    return Promise.resolve(false);
  },
  loadAll: () => {
    return Promise.resolve([]);
  },
};

const DataModelStorageServiceContext = React.createContext<
  DataModelStorageServiceState & DataModelStorage
>(noopDataModelStorageService);

export const DataModelStorageServiceProvider: React.FunctionComponent<{
  storage: DataModelStorage;
}> = ({ storage, children }) => {
  const storageRef = useRef(storage);
  const [serviceState, setServiceState] =
    useState<DataModelStorageServiceState>({
      status: 'INITIAL',
      error: null,
      items: [],
    });
  const service = useMemo(() => {
    return {
      ...serviceState,
      async save(item: MongoDBDataModelDescription) {
        const hasSaved = await storageRef.current.save(item);
        if (hasSaved) {
          void this.loadAll().catch(() => {
            // We can ignore the error when refreshing, loadAll will keep this
            // state around for us
          });
        }
        return hasSaved;
      },
      async loadAll() {
        setServiceState((prevState) => {
          return {
            ...prevState,
            status: prevState.status === 'INITIAL' ? 'LOADING' : 'REFRESHING',
          };
        });
        try {
          const items = await storageRef.current.loadAll();
          setServiceState((prevState) => {
            return { ...prevState, items, error: null, status: 'READY' };
          });
          return items;
        } catch (err) {
          setServiceState((prevState) => {
            return { ...prevState, error: err as Error, status: 'ERROR' };
          });
          throw err;
        }
      },
    };
  }, [serviceState]);
  const serviceRef = useRef(service);
  useEffect(() => {
    void serviceRef.current.loadAll().catch(() => {
      // handled by the method
    });
  }, []);
  return (
    <DataModelStorageServiceContext.Provider value={service}>
      {children}
    </DataModelStorageServiceContext.Provider>
  );
};

export function useDataModelSavedItems() {
  const { status, error, items } = useContext(DataModelStorageServiceContext);
  return { status, error, items };
}

export const dataModelStorageServiceLocator = createServiceLocator(() => {
  const service = useContext(DataModelStorageServiceContext);
  return {
    save: service.save.bind(service),
    loadAll: service.loadAll.bind(service),
  };
}, 'dataModelStorageServiceLocator');

export type DataModelStorageService = ReturnType<
  typeof dataModelStorageServiceLocator
>;
