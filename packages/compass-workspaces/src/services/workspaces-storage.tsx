import { createServiceLocator } from '@mongodb-js/compass-app-registry';
import {
  type z,
  UserData,
  type ReadAllResult,
} from '@mongodb-js/compass-user-data';
import React, { useContext } from 'react';
import { WorkspacesStateSchema } from '@mongodb-js/workspace-info';

const throwIfNotTestEnv = () => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error("Can't find Workspaces storage service in React context");
  }
};

export class noopUserData<T extends z.ZodType> extends UserData<T> {
  write(): Promise<boolean> {
    throwIfNotTestEnv();
    return Promise.resolve(true);
  }
  delete(): Promise<boolean> {
    throwIfNotTestEnv();
    return Promise.resolve(true);
  }
  readAll(): Promise<ReadAllResult<T>> {
    throwIfNotTestEnv();
    return Promise.resolve({ data: [], errors: [] });
  }
  readOne(): Promise<z.output<T> | undefined> {
    throwIfNotTestEnv();
    return Promise.resolve(undefined);
  }
  updateAttributes(): Promise<boolean> {
    throwIfNotTestEnv();
    return Promise.resolve(true);
  }
}

export const noopWorkspacesStorageService: UserData<
  typeof WorkspacesStateSchema
> = new noopUserData(WorkspacesStateSchema, 'WorkspacesState', {
  kind: 'local',
  fetch: () => Promise.reject(new Error('No user data storage')),
});

export const WorkspacesStorageServiceContext = React.createContext<
  UserData<typeof WorkspacesStateSchema>
>(noopWorkspacesStorageService);

export const workspacesStorageServiceLocator = createServiceLocator(() => {
  const service = useContext(WorkspacesStorageServiceContext);
  return service;
}, 'workspacesStorageServiceLocator');
