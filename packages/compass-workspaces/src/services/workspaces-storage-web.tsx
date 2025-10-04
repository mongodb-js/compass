import React from 'react';
import { AtlasUserData } from '@mongodb-js/compass-user-data';
import {
  WorkspacesStateSchema,
  WorkspacesStorageServiceProvider,
} from './workspaces-storage';
import { atlasServiceLocator } from '@mongodb-js/atlas-service/provider';
import { EJSON } from 'bson';

export const WorkspacesStorageServiceProviderWeb: React.FunctionComponent<{
  orgId: string;
  projectId: string;
}> = ({ orgId, projectId, children }) => {
  const atlasService = atlasServiceLocator();
  const userData = new AtlasUserData(WorkspacesStateSchema, 'WorkspacesState', {
    orgId,
    projectId,
    getResourceUrl: (path?: string) => {
      const url = atlasService.userDataEndpoint(`/${path || ''}`);
      return url;
    },
    authenticatedFetch: atlasService.authenticatedFetch.bind(atlasService),
    serialize: (content) => EJSON.stringify(content),
    deserialize: (content: string) => EJSON.parse(content),
  });
  return (
    <WorkspacesStorageServiceProvider storage={userData}>
      {children}
    </WorkspacesStorageServiceProvider>
  );
};
