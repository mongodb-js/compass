import React from 'react';
import { FileUserData, type IUserData } from '@mongodb-js/compass-user-data';
import { WorkspacesStateSchema } from '@mongodb-js/workspace-info';
import { EJSON } from 'bson';
import { useInitialValue } from '@mongodb-js/compass-components';
import { WorkspacesStorageServiceContext } from './workspaces-storage';

export const WorkspacesStorageServiceProviderDesktop: React.FunctionComponent<{
  children?: React.ReactNode;
}> = ({ children }) => {
  const storageRef = useInitialValue<IUserData<typeof WorkspacesStateSchema>>(
    new FileUserData(WorkspacesStateSchema, 'WorkspacesState', {
      serialize: (content) =>
        EJSON.stringify(content, {
          relaxed: false,
        }),
      deserialize: (content: string) => EJSON.parse(content),
    })
  );
  return (
    <WorkspacesStorageServiceContext.Provider value={storageRef}>
      {children}
    </WorkspacesStorageServiceContext.Provider>
  );
};
