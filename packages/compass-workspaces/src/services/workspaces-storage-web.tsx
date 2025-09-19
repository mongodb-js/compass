import React from 'react';
import { useRef } from 'react';
import type {
  WorkspacesStateData,
  WorkspacesStorage,
} from './workspaces-storage';
import { AtlasUserData } from '@mongodb-js/compass-user-data';
import { WorkspacesStateSchema } from './workspaces-storage';
import { EJSON } from 'bson';
import { WorkspacesStorageServiceProvider } from '../provider';
import type { AtlasService } from '@mongodb-js/atlas-service/provider';
import { atlasServiceLocator } from '@mongodb-js/atlas-service/provider';

class WorkspacesStorageWeb implements WorkspacesStorage {
  private userData: AtlasUserData<typeof WorkspacesStateSchema>;

  constructor(orgId: string, projectId: string, atlasService: AtlasService) {
    this.userData = new AtlasUserData(
      WorkspacesStateSchema,
      'WorkspacesState',
      {
        orgId,
        projectId,
        getResourceUrl: (path?: string) => {
          const url = atlasService.userDataEndpoint(`/${path || ''}`);
          return url;
        },
        authenticatedFetch: atlasService.authenticatedFetch.bind(atlasService),
        serialize: (content) => EJSON.stringify(content),
        deserialize: (content: string) => EJSON.parse(content),
      }
    );
  }
  save(state: WorkspacesStateData): Promise<boolean> {
    return this.userData.write('current-workspace', state);
  }
  load(): Promise<WorkspacesStateData | null> {
    return this.userData
      .readOne('current-workspace')
      .then((data) => data ?? null);
  }
}

export const WorkspacesStorageServiceProviderWeb: React.FC<{
  orgId: string;
  projectId: string;
}> = ({ orgId, projectId, children }) => {
  const atlasService = atlasServiceLocator();
  const storage = useRef(
    new WorkspacesStorageWeb(orgId, projectId, atlasService)
  );
  return (
    <WorkspacesStorageServiceProvider storage={storage}>
      {children}
    </WorkspacesStorageServiceProvider>
  );
};
