import React from 'react';
import {
  UserData,
  createBridgeUserDataFetch,
} from '@mongodb-js/compass-user-data';
import { WorkspacesStateSchema } from '@mongodb-js/workspace-info';
import { EJSON } from 'bson';
import { useInitialValue } from '@mongodb-js/compass-components';
import { WorkspacesStorageServiceContext } from './workspaces-storage';

export const WorkspacesStorageServiceProviderDesktop: React.FunctionComponent<{
  children?: React.ReactNode;
}> = ({ children }) => {
  const storageRef = useInitialValue<UserData<typeof WorkspacesStateSchema>>(
    new UserData(
      WorkspacesStateSchema,
      'WorkspacesState',
      { kind: 'local', fetch: createBridgeUserDataFetch() },
      {
        serialize: (content) =>
          EJSON.stringify(content, {
            relaxed: false,
          }),
        deserialize: (content: string) => EJSON.parse(content),
      }
    )
  );
  return (
    <WorkspacesStorageServiceContext.Provider value={storageRef}>
      {children}
    </WorkspacesStorageServiceContext.Provider>
  );
};
