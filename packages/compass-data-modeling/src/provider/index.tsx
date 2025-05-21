import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import type {
  DataModelStorage,
  MongoDBDataModelDescription,
} from '../services/data-model-storage';
import { createServiceLocator } from 'hadron-app-registry';

export type DataModelStorageServiceState = {
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
        const saved = await storageRef.current.save(toSave);
        // If save fails in storage, we don't want to update the state
        // to avoid showing the item in the list.
        if (!saved) {
          return false;
        }
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
        return true;
      },
      async delete(id: MongoDBDataModelDescription['id']) {
        const deleted = await storageRef.current.delete(id);
        // If delete fails in storage, we don't want to update the state
        // to avoid showing the item in the list.
        if (!deleted) {
          return false;
        }
        setServiceState((prevState) => {
          return {
            ...prevState,
            items: prevState.items.filter((item) => {
              return item.id !== id;
            }),
          };
        });
        return true;
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
