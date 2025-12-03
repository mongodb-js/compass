import React from 'react';
import { AtlasUserData, type IUserData } from '@mongodb-js/compass-user-data';
import { WorkspacesStorageServiceContext } from './workspaces-storage';
import { WorkspacesStateSchema } from '../types';
import { EJSON } from 'bson';
import { useInitialValue } from '@mongodb-js/compass-components';

export const WorkspacesStorageServiceProviderWeb: React.FunctionComponent<{
  orgId: string;
  projectId: string;
  getResourceUrl: (path?: string) => string;
  authenticatedFetch: (
    url: RequestInfo | URL,
    options?: RequestInit
  ) => Promise<Response>;
}> = ({ orgId, projectId, getResourceUrl, authenticatedFetch, children }) => {
  const storageRef = useInitialValue<IUserData<typeof WorkspacesStateSchema>>(
    new AtlasUserData(WorkspacesStateSchema, 'WorkspacesState', {
      orgId,
      projectId,
      getResourceUrl,
      authenticatedFetch,
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
