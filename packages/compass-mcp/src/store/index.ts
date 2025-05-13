import type { PreferencesAccess } from 'compass-preferences-model/provider';
import type { ConnectionsService } from '@mongodb-js/compass-connections/provider';
import type { TrackFunction } from '@mongodb-js/compass-telemetry/provider';
import type { Logger } from '@mongodb-js/compass-logging/provider';
import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';
import type { ActivateHelpers } from 'hadron-app-registry';
import reducer from './reducer';
import type { MCPStoreExtraArgs } from './reducer';
import { MCPService } from '../mcp-service';

export type MCPStoreOptions = Record<string, unknown>;

export type MCPStoreServices = {
  preferences: PreferencesAccess;
  track: TrackFunction;
  logger: Logger;
  connections: ConnectionsService;
};

export function activateMCPStore(
  _: MCPStoreOptions,
  services: MCPStoreServices,
  { cleanup }: ActivateHelpers
) {
  const store = createStore(
    reducer,
    applyMiddleware(
      thunk.withExtraArgument<MCPStoreExtraArgs>({
        ...services,
        // TODO: Pass it as a service maybe?
        mcpService: new MCPService(),
      })
    )
  );
  return { store, deactivate: cleanup };
}
