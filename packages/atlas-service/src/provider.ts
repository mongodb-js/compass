import { createContext, useContext } from 'react';
import { AtlasService } from './renderer';

const AtlasServiceContext = createContext<AtlasService | null>(null);

export const AtlasServiceProvider = AtlasServiceContext.Provider;

export function atlasServiceLocator(): AtlasService {
  const atlasService = useContext(AtlasServiceContext);
  if (!atlasService) {
    throw new Error('No AtlasService available in this context');
  }
  return atlasService;
}
