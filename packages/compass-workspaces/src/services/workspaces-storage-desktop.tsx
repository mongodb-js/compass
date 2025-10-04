import React from 'react';
import { FileUserData, type IUserData } from '@mongodb-js/compass-user-data';
import {
  WorkspacesStateSchema,
  WorkspacesStorageServiceProvider,
} from './workspaces-storage';
import { EJSON } from 'bson';

const storage = new FileUserData(WorkspacesStateSchema, 'WorkspacesState', {
  serialize: (content) => EJSON.stringify(content, undefined, 2),
  deserialize: (content: string) => EJSON.parse(content),
}) as IUserData<typeof WorkspacesStateSchema>;

export const WorkspacesStorageServiceProviderDesktop: React.FunctionComponent =
  ({ children }) => {
    return (
      <WorkspacesStorageServiceProvider storage={storage}>
        {children}
      </WorkspacesStorageServiceProvider>
    );
  };
