import { createContext, useContext } from 'react';
import type { AtlasAuthService } from './renderer';

const AtlasAuthServiceContext = createContext<AtlasAuthService | null>(null);

export const AtlasAuthServiceProvider = AtlasAuthServiceContext.Provider;

export function atlasAuthServiceLocator(): AtlasAuthService {
  const service = useContext(AtlasAuthServiceContext);
  if (!service) {
    throw new Error('No AtlasAuthService available in this context');
  }
  return service;
}
