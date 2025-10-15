import React, { useRef } from 'react';
import { FileUserData, type IUserData } from '@mongodb-js/compass-user-data';
import {
  WorkspacesStateSchema,
  WorkspacesStorageServiceContext,
} from './workspaces-storage';
import { EJSON } from 'bson';

export const WorkspacesStorageServiceProviderDesktop: React.FunctionComponent =
  ({ children }) => {
    const storageRef = useRef<IUserData<typeof WorkspacesStateSchema>>(
      new FileUserData(WorkspacesStateSchema, 'WorkspacesState', {
        serialize: (content) =>
          EJSON.stringify(content, {
            relaxed: false,
          }),
        deserialize: (content: string) => EJSON.parse(content),
      }) as IUserData<typeof WorkspacesStateSchema>
    );
    return (
      <WorkspacesStorageServiceContext.Provider value={storageRef.current}>
        {children}
      </WorkspacesStorageServiceContext.Provider>
    );
  };
