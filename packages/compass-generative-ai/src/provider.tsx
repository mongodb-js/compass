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
  apiURLPreset: 'admin-api' | 'cloud';
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

    const telemetryAnonymousId = usePreference('telemetryAnonymousId');

    const toolsController = useMemo(() => {
      return new ToolsController({
        logger,
        getTelemetryAnonymousId: () => telemetryAnonymousId ?? '',
      });
    }, [logger, telemetryAnonymousId]);

    const promiseRef = React.useRef<Promise<void> | null>(null);

    useEffect(() => {
      promiseRef.current = toolsController.startServer();
      return () => {
        if (!promiseRef.current) {
          return;
        }
        void promiseRef.current.finally(() => {
          void toolsController.stopServer();
        });
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
