import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import type {
  WorkspacesStorage,
  WorkspacesStateData,
} from '../services/workspaces-storage';
import { createServiceLocator } from '@mongodb-js/compass-app-registry';

export type WorkspacesStorageServiceState = {
  status: 'INITIAL' | 'LOADING' | 'READY' | 'ERROR';
  error: Error | null;
  workspaces: WorkspacesStateData | null;
};

export const noopWorkspacesStorageService: WorkspacesStorageServiceState &
  WorkspacesStorage = {
  status: 'INITIAL',
  error: null,
  workspaces: null,
  save: () => {
    return Promise.resolve(false);
  },
  load: () => {
    return Promise.resolve(null);
  },
};

const WorkspacesStorageServiceContext = React.createContext<
  WorkspacesStorageServiceState & WorkspacesStorage
>(noopWorkspacesStorageService);

export const WorkspacesStorageServiceProvider: React.FunctionComponent<{
  storage: WorkspacesStorage;
}> = ({ storage, children }) => {
  const storageRef = useRef(storage);
  const [serviceState, setServiceState] =
    useState<WorkspacesStorageServiceState>({
      status: 'INITIAL',
      error: null,
      workspaces: null,
    });
  const service = useMemo(() => {
    return {
      ...serviceState,
      async save(toSave: WorkspacesStateData) {
        setServiceState((prevState) => {
          return {
            ...prevState,
            workspaces: toSave,
          };
        });
        return storageRef.current.save(toSave);
      },
      async load() {
        setServiceState((prevState) => {
          return {
            ...prevState,
            status: 'LOADING',
          };
        });
        try {
          const workspaces = await storageRef.current.load();
          setServiceState((prevState) => {
            return { ...prevState, workspaces, error: null, status: 'READY' };
          });
          return workspaces;
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
    void serviceRef.current.load().catch(() => {
      // handled by the method
    });
  }, []);

  return (
    <WorkspacesStorageServiceContext.Provider value={service}>
      {children}
    </WorkspacesStorageServiceContext.Provider>
  );
};

export function useSavedWorkspaces() {
  const { status, error, workspaces } = useContext(
    WorkspacesStorageServiceContext
  );
  return { status, error, workspaces };
}

export const workspacesStorageServiceLocator = createServiceLocator(() => {
  const service = useContext(WorkspacesStorageServiceContext);
  return {
    save: service.save.bind(service),
    load: service.load.bind(service),
  };
}, 'workspacesStorageServiceLocator');

export type WorkspacesStorageService = ReturnType<
  typeof workspacesStorageServiceLocator
>;
