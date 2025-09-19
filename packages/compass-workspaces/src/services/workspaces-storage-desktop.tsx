import React from 'react';
import type {
  WorkspacesStateData,
  WorkspacesStorage,
} from './workspaces-storage';
import { FileUserData } from '@mongodb-js/compass-user-data';
import { WorkspacesStateSchema } from './workspaces-storage';
import { EJSON } from 'bson';
import { WorkspacesStorageServiceProvider } from '../provider';

class WorkspacesStorageDesktop implements WorkspacesStorage {
  private userData = new FileUserData(
    WorkspacesStateSchema,
    'WorkspacesState',
    {
      serialize: (content) => EJSON.stringify(content, undefined, 2),
      deserialize: (content: string) => EJSON.parse(content),
    }
  );
  save(state: WorkspacesStateData): Promise<boolean> {
    return this.userData.write('current-workspace', state);
  }
  load(): Promise<WorkspacesStateData | null> {
    return this.userData
      .readOne('current-workspace', {
        ignoreErrors: true,
      })
      .then((data) => data ?? null);
  }
}

const storage = new WorkspacesStorageDesktop();

export const WorkspacesStorageServiceProviderDesktop: React.FunctionComponent =
  ({ children }) => {
    return (
      <WorkspacesStorageServiceProvider storage={storage}>
        {children}
      </WorkspacesStorageServiceProvider>
    );
  };

export default storage;
