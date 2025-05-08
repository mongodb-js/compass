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

export const noopDataModelStorageService: DataModelStorageServiceState &
  DataModelStorage = {
  status: 'INITIAL',
  error: null,
  items: [],
  save: () => {
    return Promise.resolve(false);
  },
  delete: () => {
    return Promise.resolve(false);
  },
  loadAll: () => {
    return Promise.resolve([]);
  },
  load: () => {
    return Promise.resolve(null);
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
      async save(toSave: MongoDBDataModelDescription) {
        setServiceState((prevState) => {
          const itemIdx = prevState.items.findIndex((item) => {
            return item.id === toSave.id;
          });
          if (itemIdx === -1) {
            prevState.items.push(toSave);
          } else {
            prevState.items[itemIdx] = toSave;
          }
          return {
            ...prevState,
            items: [...prevState.items],
          };
        });
        return storageRef.current.save(toSave);
      },
      async delete(id: MongoDBDataModelDescription['id']) {
        setServiceState((prevState) => {
          return {
            ...prevState,
            items: prevState.items.filter((item) => {
              return item.id !== id;
            }),
          };
        });
        return storageRef.current.delete(id);
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
      async load(id: string) {
        return (
          (await this.loadAll()).find((item) => {
            return item.id === id;
          }) ?? null
        );
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
    delete: service.delete.bind(service),
    loadAll: service.loadAll.bind(service),
    load: service.load.bind(service),
  };
}, 'dataModelStorageServiceLocator');

export type DataModelStorageService = ReturnType<
  typeof dataModelStorageServiceLocator
>;
