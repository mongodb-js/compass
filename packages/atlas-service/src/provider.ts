import { createContext, useContext } from 'react';
import type { AtlasService } from './atlas-service';

const AtlasServiceContext = createContext<AtlasService | null>(null);

export const AtlasServiceProvider = AtlasServiceContext.Provider;

export function atlasServiceLocator(): AtlasService {
  const client = useContext(AtlasServiceContext);
  if (!client) {
    throw new Error('No AtlasService available in this context');
  }
  return client;
}
