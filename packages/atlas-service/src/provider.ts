import { createContext, useContext } from 'react';
import type { AtlasAiClient, AtlasAuthClient } from './renderer';

export type AtlasServices = {
  aiClient: AtlasAiClient;
  authClient: AtlasAuthClient;
};
const AtlasServicesContext = createContext<AtlasServices | null>(null);

export const AtlasServicesProvider = AtlasServicesContext.Provider;

export function atlasServicesLocator(): AtlasServices {
  const services = useContext(AtlasServicesContext);
  if (!services) {
    throw new Error('No AtlasService available in this context');
  }
  return services;
}
