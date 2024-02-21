import React, { createContext, useContext, useMemo } from 'react';
import { AtlasAiService } from './atlas-ai-service';
import { preferencesLocator } from 'compass-preferences-model/provider';
import { createLoggerAndTelemetryLocator } from '@mongodb-js/compass-logging/provider';
import type { AtlasServiceOptions } from '@mongodb-js/atlas-service/provider';
import {
  atlasAuthServiceLocator,
  AtlasService,
} from '@mongodb-js/atlas-service/provider';

const AtlasAiServiceContext = createContext<AtlasAiService | null>(null);

type AtlasAiServiceProviderProps = {
  /** Extra headers to send in an http request */
  defaultHttpHeaders?: AtlasServiceOptions['defaultHeaders'];
};

export const AtlasAiServiceProvider: React.FC<AtlasAiServiceProviderProps> = ({
  defaultHttpHeaders,
  children,
}) => {
  const logger = createLoggerAndTelemetryLocator('ATLAS-AI-SERVICE')();
  const preferences = preferencesLocator();
  const atlasAuthService = atlasAuthServiceLocator();

  const aiService = useMemo(() => {
    const atlasService = new AtlasService(
      atlasAuthService,
      preferences,
      logger,
      {
        defaultHeaders: defaultHttpHeaders,
      }
    );
    return new AtlasAiService(
      atlasService,
      atlasAuthService,
      preferences,
      logger
    );
  }, [atlasAuthService, preferences, logger]);

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
