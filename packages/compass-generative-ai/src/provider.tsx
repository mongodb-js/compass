import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { AtlasAiService } from './atlas-ai-service';
import { ToolsController } from './tools-controller';
import {
  preferencesLocator,
  usePreference,
} from 'compass-preferences-model/provider';
import { useLogger } from '@mongodb-js/compass-logging/provider';
import { atlasServiceLocator } from '@mongodb-js/atlas-service/provider';
import {
  createServiceLocator,
  createServiceProvider,
} from '@mongodb-js/compass-app-registry';

const AtlasAiServiceContext = createContext<AtlasAiService | null>(null);

export const AtlasAiServiceProvider: React.FC<{
  apiURLPreset: 'private-api' | 'cloud';
}> = createServiceProvider(function AtlasAiServiceProvider({
  apiURLPreset,
  children,
}) {
  const logger = useLogger('ATLAS-AI-SERVICE');
  const preferences = preferencesLocator();
  const atlasService = atlasServiceLocator();

  const aiService = useMemo(() => {
    return new AtlasAiService({
      apiURLPreset,
      atlasService,
      preferences,
      logger,
    });
  }, [apiURLPreset, preferences, logger, atlasService]);

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
export { AtlasAiService } from './atlas-ai-service';

const ToolsControllerContext = createContext<ToolsController | null>(null);

export const ToolsControllerProvider: React.FC = createServiceProvider(
  function ToolsControllerProvider({ children }) {
    const logger = useLogger('TOOLS-CONTROLLER');
    const preferences = preferencesLocator();
    const atlasService = atlasServiceLocator();

    const telemetryAnonymousId = usePreference('telemetryAnonymousId');

    const toolsController = useMemo(() => {
      return new ToolsController({
        logger,
        getTelemetryAnonymousId: () => telemetryAnonymousId ?? '',
        // we will set this later through setContext()
        enableTelemetry: false,
        preferences,
        atlasService,
      });
    }, [logger, telemetryAnonymousId, preferences, atlasService]);

    useEffect(() => {
      return () => {
        // in case it was ever started
        void toolsController.stopServer();
      };
    }, [toolsController]);

    return (
      <ToolsControllerContext.Provider value={toolsController}>
        {children}
      </ToolsControllerContext.Provider>
    );
  }
);

function useToolsControllerContext(): ToolsController {
  const service = useContext(ToolsControllerContext);
  if (!service) {
    throw new Error('No ToolsController available in this context');
  }
  return service;
}

export const toolsControllerLocator = createServiceLocator(
  useToolsControllerContext,
  'toolsControllerLocator'
);
export { ToolsController } from './tools-controller';
export type { ToolGroup } from './tools-controller';

// Export the hook for direct use in components
export const useToolsController = useToolsControllerContext;

export { getAvailableTools, READ_ONLY_DATABASE_TOOLS } from './available-tools';
export { AI_MODEL_CHAT_VERSION, AI_MODEL_SLIM_VERSION } from './model-version';

export {
  AIExperienceEntry,
  GenerativeAIInput,
  createAIPlaceholderHTMLPlaceholder,
} from './components';

export {
  AtlasAiServiceInvalidInputError,
  AtlasAiServiceApiResponseParseError,
} from './atlas-ai-errors';

export type {
  MockDataSchemaRequest,
  MockDataSchemaRawField,
  MockDataSchemaToolOutput,
} from './atlas-ai-service';

export { mockDataSchemaToolSchema } from './atlas-ai-service';
