import React, { createContext, useContext, useMemo } from 'react';
import { type AIEndpoint, AtlasAiService } from './atlas-ai-service';
import { preferencesLocator } from 'compass-preferences-model/provider';
import { useLogger } from '@mongodb-js/compass-logging/provider';
import { atlasServiceLocator } from '@mongodb-js/atlas-service/provider';
import {
  createServiceLocator,
  createServiceProvider,
} from 'hadron-app-registry';

const AtlasAiServiceContext = createContext<AtlasAiService | null>(null);

export type URLConfig = {
  'user-access': (userId: string) => string;
  query: string;
  aggregation: string;
};

export const AtlasAiServiceProvider: React.FC<{
  apiURLPreset: 'admin-api' | 'cloud';
  urlConfig: URLConfig;
}> = createServiceProvider(function AtlasAiServiceProvider({
  apiURLPreset,
  children,
  urlConfig,
}) {
  const logger = useLogger('ATLAS-AI-SERVICE');
  const preferences = preferencesLocator();
  const atlasService = atlasServiceLocator();

  const aiService = useMemo(() => {
    const userId = preferences.getPreferencesUser().id;

    return new AtlasAiService({
      getUrlForEndpoint: (urlId: AIEndpoint) => {
        const urlPath: string =
          urlId === 'user-access' ? urlConfig[urlId](userId) : urlConfig[urlId];

        return apiURLPreset === 'admin-api'
          ? atlasService.adminApiEndpoint(urlPath)
          : atlasService.cloudEndpoint(urlPath);
      },
      atlasService,
      preferences,
      logger,
    });
  }, [apiURLPreset, preferences, logger, atlasService, urlConfig]);

  return (
    <AtlasAiServiceContext.Provider value={aiService}>
      {children}
    </AtlasAiServiceContext.Provider>
  );
});

function useAtlasAiServiceContext(): AtlasAiService {
  const service = useContext(AtlasAiServiceContext);
  if (!service) {
    throw new Error('No AtlasAiService available in this context');
  }
  return service;
}

export const atlasAiServiceLocator = createServiceLocator(
  useAtlasAiServiceContext,
  'atlasAiServiceLocator'
);
export { AtlasAiService, aiURLConfig } from './atlas-ai-service';
export type { AIEndpoint } from './atlas-ai-service';
