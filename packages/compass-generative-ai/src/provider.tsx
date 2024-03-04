import React, { createContext, useContext, useMemo } from 'react';
import { AtlasAiService } from './atlas-ai-service';
import { preferencesLocator } from 'compass-preferences-model/provider';
import { useLoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';
import {
  atlasAuthServiceLocator,
  atlasServiceLocator,
} from '@mongodb-js/atlas-service/provider';

const AtlasAiServiceContext = createContext<AtlasAiService | null>(null);

export const AtlasAiServiceProvider: React.FC = ({ children }) => {
  const logger = useLoggerAndTelemetry('ATLAS-AI-SERVICE');
  const preferences = preferencesLocator();
  const atlasAuthService = atlasAuthServiceLocator();
  const atlasService = atlasServiceLocator();

  const aiService = useMemo(() => {
    return new AtlasAiService(
      atlasService,
      atlasAuthService,
      preferences,
      logger
    );
  }, [atlasAuthService, preferences, logger, atlasService]);

  return (
    <AtlasAiServiceContext.Provider value={aiService}>
      {children}
    </AtlasAiServiceContext.Provider>
  );
};

function useAtlasServiceLocator(): AtlasAiService {
  const service = useContext(AtlasAiServiceContext);
  if (!service) {
    throw new Error('No AtlasAiService available in this context');
  }
  return service;
}

export const atlasAiServiceLocator = useAtlasServiceLocator;
export { AtlasAiService } from './atlas-ai-service';
