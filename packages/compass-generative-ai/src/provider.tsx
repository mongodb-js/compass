import React, { createContext, useContext, useMemo } from 'react';
import { AtlasAiService } from './atlas-ai-service';
// import { ToolsController } from './tools-controller';
type ToolsController = any;
import { preferencesLocator } from 'compass-preferences-model/provider';
import { useLogger } from '@mongodb-js/compass-logging/provider';
import { atlasServiceLocator } from '@mongodb-js/atlas-service/provider';
import {
  createServiceLocator,
  createServiceProvider,
} from '@mongodb-js/compass-app-registry';
// import { atlasAdminApiServiceLocator } from '@mongodb-js/atlas-admin-api/provider';
// import { telemetryLocator } from '@mongodb-js/compass-telemetry/provider';

const AtlasAiServiceContext = createContext<AtlasAiService | null>(null);

export const AtlasAiServiceProvider: React.FC<{
  apiURLPreset: 'private-api' | 'cloud';
  children?: React.ReactNode;
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

export const ToolsControllerProvider: React.FC<{
  children?: React.ReactNode;
}> = function ToolsControllerProvider({ children }) {
  return (
    <ToolsControllerContext.Provider value={null}>
      {children}
    </ToolsControllerContext.Provider>
  );
};

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
// export { ToolsController } from './tools-controller';
// export type { ToolGroup } from './tools-controller';
// Re-exported as the local stub type so type-only consumers still
// compile without dragging tools-controller (and mongodb-mcp-server)
// back into the renderer bundle.
export type { ToolsController };
export type ToolGroup = 'querybar' | 'aggregation-builder' | 'db-read';

// Export the hook for direct use in components
export const useToolsController = useToolsControllerContext;

export {
  getAvailableTools,
  READ_ONLY_DATABASE_TOOLS,
  doesToolUseConnection,
  isReadOnlyTool,
  isAtlasTool,
} from './available-tools';
export {
  AI_MODEL_AGENT_VERSION,
  AI_MODEL_CHAT_VERSION,
  AI_MODEL_SLIM_VERSION,
} from './model-version';

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

export type { AtlasConnectionDebugResult } from './tools/debug-connection';
