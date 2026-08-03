import React, { createContext, useContext, useEffect, useMemo } from 'react';
import {
  atlasAuthServiceLocator,
  atlasServiceLocator,
} from '@mongodb-js/atlas-service/provider';
import {
  createServiceLocator,
  createServiceProvider,
} from '@mongodb-js/compass-app-registry';
import { AtlasAdminApiService } from './atlas-admin-api-service';

const AtlasAdminApiServiceContext = createContext<AtlasAdminApiService | null>(
  null
);

export const AtlasAdminApiServiceProvider: React.FC = createServiceProvider(
  function AtlasAdminApiServiceProvider({ children }) {
    const atlasService = atlasServiceLocator();
    const authService = atlasAuthServiceLocator();

    const adminApiService = useMemo(() => {
      return new AtlasAdminApiService(atlasService);
    }, [atlasService]);

    useEffect(() => {
      const clearCache = () => adminApiService.clearCache();
      authService.on('signed-out', clearCache);
      return () => {
        authService.off('signed-out', clearCache);
      };
    }, [authService, adminApiService]);

    return (
      <AtlasAdminApiServiceContext.Provider value={adminApiService}>
        {children}
      </AtlasAdminApiServiceContext.Provider>
    );
  }
);

function useAtlasAdminApiServiceContext(): AtlasAdminApiService {
  const service = useContext(AtlasAdminApiServiceContext);
  if (!service) {
    throw new Error('No AtlasAdminApiService available in this context');
  }
  return service;
}

export const atlasAdminApiServiceLocator = createServiceLocator(
  useAtlasAdminApiServiceContext,
  'atlasAdminApiServiceLocator'
);

export type {
  AtlasAdminApiService,
  AtlasAdminApiRequestOptions,
  AtlasProjectAndCluster,
} from './atlas-admin-api-service';
export {
  ATLAS_CLUSTER_STATES,
  type AtlasAccessListEntry,
  type AtlasCluster,
  type AtlasClusterConnectionStrings,
  type AtlasClusterState,
  type AtlasGroupCluster,
} from './cluster-types';
export { ATLAS_ADMIN_API_DEFAULT_VERSION } from './version';
