import { createContext, useContext } from 'react';
import type { AtlasHttpApiClient } from './renderer';

const AtlasHttpClientContext = createContext<AtlasHttpApiClient | null>(null);

export const AtlasHttpClientProvider = AtlasHttpClientContext.Provider;

export function atlasHttpClientLocator(): AtlasHttpApiClient {
  const client = useContext(AtlasHttpClientContext);
  if (!client) {
    throw new Error('No AtlasHttpApiClient available in this context');
  }
  return client;
}
