import { createContext, useContext } from 'react';
import type { AtlasAiService } from './atlas-ai-service';

const AtlasAiServiceContext = createContext<AtlasAiService | null>(null);

export const AtlasAiServiceProvider = AtlasAiServiceContext.Provider;

export function atlasAiServiceLocator(): AtlasAiService {
  const service = useContext(AtlasAiServiceContext);
  if (!service) {
    throw new Error('No AtlasAiService available in this context');
  }
  return service;
}
