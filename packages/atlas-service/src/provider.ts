import { createContext, useContext } from 'react';
import type { AtlasAuthService } from './atlas-auth-service';

const AtlasAuthServiceContext = createContext<AtlasAuthService | null>(null);

export const AtlasAuthServiceProvider = AtlasAuthServiceContext.Provider;

export function atlasAuthServiceLocator(): AtlasAuthService {
  const service = useContext(AtlasAuthServiceContext);
  if (!service) {
    throw new Error('No AtlasAuthService available in this context');
  }
  return service;
}

export { AtlasAuthService } from './atlas-auth-service';
export { AtlasService, type AtlasServiceOptions } from './atlas-service';
