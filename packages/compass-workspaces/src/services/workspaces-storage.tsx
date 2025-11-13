import { createServiceLocator } from '@mongodb-js/compass-app-registry';
import {
  type z,
  IUserData,
  type ReadAllResult,
} from '@mongodb-js/compass-user-data';
import React, { useContext } from 'react';
import { WorkspacesStateSchema } from '../types';

const throwIfNotTestEnv = () => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error("Can't find Workspaces storage service in React context");
  }
};

export class noopUserData<T extends z.Schema> extends IUserData<T> {
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
  readOne(): Promise<z.output<T>> {
    throwIfNotTestEnv();
    return Promise.resolve(undefined);
  }
  updateAttributes(): Promise<boolean> {
    throwIfNotTestEnv();
    return Promise.resolve(true);
  }
}

export const noopWorkspacesStorageService: IUserData<
  typeof WorkspacesStateSchema
> = new noopUserData(WorkspacesStateSchema, 'WorkspacesState');

export const WorkspacesStorageServiceContext = React.createContext<
  IUserData<typeof WorkspacesStateSchema>
>(noopWorkspacesStorageService);

export const workspacesStorageServiceLocator = createServiceLocator(() => {
  const service = useContext(WorkspacesStorageServiceContext);
  return service;
}, 'workspacesStorageServiceLocator');
