import React from 'react';
import { AtlasUserData, type IUserData } from '@mongodb-js/compass-user-data';
import type { AtlasService } from '@mongodb-js/atlas-service/provider';
import { WorkspacesStorageServiceContext } from './workspaces-storage';
import { WorkspacesStateSchema } from '@mongodb-js/workspace-info';
import { EJSON } from 'bson';
import { useInitialValue } from '@mongodb-js/compass-components';

export const WorkspacesStorageServiceProviderWeb: React.FunctionComponent<{
  orgId: string;
  projectId: string;
  atlasService: AtlasService;
}> = ({ orgId, projectId, atlasService, children }) => {
  const storageRef = useInitialValue<IUserData<typeof WorkspacesStateSchema>>(
    new AtlasUserData(WorkspacesStateSchema, 'WorkspacesState', {
      orgId,
      projectId,
      atlasService,
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
