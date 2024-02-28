import React, { createContext, useContext, useMemo } from 'react';
import type { AtlasAuthService } from './atlas-auth-service';
import { AtlasService, type AtlasServiceOptions } from './atlas-service';
import { preferencesLocator } from 'compass-preferences-model/provider';
import { useLoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';

const AtlasAuthServiceContext = createContext<AtlasAuthService | null>(null);
export const AtlasAuthServiceProvider = AtlasAuthServiceContext.Provider;
function useAtlasAuthServiceLocator(): AtlasAuthService {
  const service = useContext(AtlasAuthServiceContext);
  if (!service) {
    throw new Error('No AtlasAuthService available in this context');
  }
  return service;
}
export const atlasAuthServiceLocator = useAtlasAuthServiceLocator;

const AtlasServiceContext = createContext<AtlasService | null>(null);
export const AtlasServiceProvider: React.FC<{
  options?: AtlasServiceOptions;
}> = ({ options, children }) => {
  const logger = useLoggerAndTelemetry('ATLAS-SERVICE');
  const preferences = preferencesLocator();
  const authService = atlasAuthServiceLocator();

  const atlasService = useMemo(() => {
    return new AtlasService(authService, preferences, logger, options);
  }, [authService, preferences, logger, options]);

  return (
    <AtlasServiceContext.Provider value={atlasService}>
      {children}
    </AtlasServiceContext.Provider>
  );
};
function useAtlasServiceLocator(): AtlasService {
  const service = useContext(AtlasServiceContext);
  if (!service) {
    throw new Error('No AtlasService available in this context');
  }
  return service;
}
export const atlasServiceLocator = useAtlasServiceLocator;

export { AtlasAuthService } from './atlas-auth-service';
export type { AtlasService } from './atlas-service';
