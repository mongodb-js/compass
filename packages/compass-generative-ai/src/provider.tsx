import React, { createContext, useContext, useMemo, useEffect } from 'react';
import { AtlasAiService } from './atlas-ai-service';
import { MCPController } from './mcp-controller';
import { preferencesLocator } from 'compass-preferences-model/provider';
import { useLogger } from '@mongodb-js/compass-logging/provider';
import { atlasServiceLocator } from '@mongodb-js/atlas-service/provider';
import {
  createServiceLocator,
  createServiceProvider,
} from '@mongodb-js/compass-app-registry';
import { connectionsLocator } from '@mongodb-js/compass-connections/provider';

const AtlasAiServiceContext = createContext<AtlasAiService | null>(null);
const MCPControllerContext = createContext<MCPController | null>(null);

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

export const MCPControllerProvider: React.FC = createServiceProvider(
  function MCPControllerProvider({ children }) {
    const logger = useLogger('MCP-CONTROLLER');
    const preferences = preferencesLocator();
    const connections = connectionsLocator();
    const mcpController = useMemo(() => {
      return new MCPController({
        logger,
        preferences,
        getTelemetryAnonymousId: () => {
          return preferences.getPreferences().telemetryAnonymousId ?? '';
        },
        connections,
      });
    }, [logger, connections, preferences]);

    useEffect(() => {
      void mcpController.activate();
      return () => {
        void mcpController.deactivate();
      };
    }, [mcpController]);

    // Listen for connection events and automatically switch MCP server connection
    useEffect(() => {
      const handleConnectionEstablished = (connectionId: string) => {
        logger.log.info(
          logger.mongoLogId(1_001_000_420),
          'MCP Controller',
          'Connection established, switching MCP server to new connection',
          { connectionId }
        );
        void mcpController.onActiveConnectionChanged(connectionId);
      };

      const handleConnectionDisconnected = (connectionId: string) => {
        logger.log.info(
          logger.mongoLogId(1_001_000_421),
          'MCP Controller',
          'Connection disconnected',
          { connectionId }
        );
        // When a connection is disconnected, clear the MCP connection
        void mcpController.onActiveConnectionChanged(undefined);
      };

      // Subscribe to connection events
      connections.on('connected', handleConnectionEstablished);
      connections.on('disconnected', handleConnectionDisconnected);

      return () => {
        connections.removeListener('connected', handleConnectionEstablished);
        connections.removeListener(
          'disconnected',
          handleConnectionDisconnected
        );
      };
    }, [mcpController, connections, logger]);

    return (
      <MCPControllerContext.Provider value={mcpController}>
        {children}
      </MCPControllerContext.Provider>
    );
  }
);

function useAtlasAiServiceContext(): AtlasAiService {
  const service = useContext(AtlasAiServiceContext);
  if (!service) {
    throw new Error('No AtlasAiService available in this context');
  }
  return service;
}

function useMCPControllerContext(): MCPController {
  const controller = useContext(MCPControllerContext);
  if (!controller) {
    throw new Error('No MCPController available in this context');
  }
  return controller;
}

export const atlasAiServiceLocator = createServiceLocator(
  useAtlasAiServiceContext,
  'atlasAiServiceLocator'
);

export const mcpControllerLocator = createServiceLocator(
  useMCPControllerContext,
  'mcpControllerLocator'
);

// Export the hook for direct use in components
export const useMCPController = useMCPControllerContext;

export { AtlasAiService } from './atlas-ai-service';
export { MCPController } from './mcp-controller';
export type { MCPServerInfo } from './mcp-controller';
