import React from 'react';
import { connect } from 'react-redux';
import { Themes, ThemeProvider } from '@mongodb-js/compass-components';
import type { Logger } from '@mongodb-js/compass-logging/provider';
import type {
  ConnectionInfoRef,
  DataService,
} from '@mongodb-js/compass-connections/provider';
import type { PreferencesAccess } from 'compass-preferences-model';
import type { TrackFunction } from '@mongodb-js/compass-telemetry';
import type { ActivateHelpers } from '@mongodb-js/compass-app-registry';
import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';

import AgentShell from './components/agent-shell';
import reducer, {
  addMessage,
  setLoading,
  updateConfig,
  toggleConfig,
  updatePendingResult,
} from './stores/store';
import type { AgentShellState, AgentConfig } from './stores/store';
import { queryAgent } from './services/ai-service';

const AGENT_THEME = { theme: Themes.Dark, enabled: true };

// ─── Connected Component ─────────────────────────────────────

type AgentShellPluginProps = { namespace?: string };

function AgentShellPluginComponent(props: AgentShellPluginProps) {
  return (
    <ThemeProvider theme={AGENT_THEME}>
      <ConnectedAgentShell namespace={props.namespace} />
    </ThemeProvider>
  );
}

export function AgentShellPlugin(props: AgentShellPluginProps) {
  return <AgentShellPluginComponent {...props} />;
}

// ─── Store-connected shell ───────────────────────────────────

type DispatchProps = {
  onSendMessage: (message: string) => void;
  onApproveCommand: (messageId: string, command: string) => void;
  onUpdateConfig: (config: Partial<AgentConfig>) => void;
  onToggleConfig: () => void;
};

const ConnectedAgentShell = connect(
  (state: AgentShellState) => ({
    messages: state.messages,
    isLoading: state.isLoading,
    agentConfig: state.agentConfig,
    showConfig: state.showConfig,
  }),
  (dispatch: any): DispatchProps => ({
    onSendMessage: (message: string, namespace?: string) => {
      dispatch(addMessage('user', message));
      dispatch(setLoading(true));

      // We use a thunk-like pattern here. The actual AI call happens
      // in the middleware/thunk set up during onActivated.
      dispatch({ type: 'compass-agent-shell/SendMessage', message, namespace });
    },
    onApproveCommand: (
      messageId: string,
      command: string,
      namespace?: string
    ) => {
      dispatch({
        type: 'compass-agent-shell/ExecuteCommand',
        messageId,
        command,
        namespace,
      });
    },
    onUpdateConfig: (config: Partial<AgentConfig>) => {
      dispatch(updateConfig(config));
    },
    onToggleConfig: () => {
      dispatch(toggleConfig());
    },
  })
)(AgentShell);

// ─── Plugin Services ─────────────────────────────────────────

export type AgentShellPluginServices = {
  logger: Logger;
  track: TrackFunction;
  dataService: DataService;
  preferences: PreferencesAccess;
  connectionInfo: ConnectionInfoRef;
};

// ─── Activation ──────────────────────────────────────────────

export function onActivated(
  _initialProps: AgentShellPluginProps,
  services: AgentShellPluginServices,
  { addCleanup, cleanup }: ActivateHelpers
) {
  const { dataService, connectionInfo, logger } = services;

  // Custom middleware to handle async AI calls and command execution
  const agentMiddleware =
    (storeApi: any) => (next: any) => async (action: any) => {
      const result = next(action);

      if (action.type === 'compass-agent-shell/SendMessage') {
        const state = storeApi.getState() as AgentShellState;
        const config = state.agentConfig;

        try {
          // Gather DB context
          const dbName =
            action.namespace?.split('.')[0] ||
            (connectionInfo.current.connectionOptions?.connectionString
              ? getDatabaseFromUri(
                  connectionInfo.current.connectionOptions.connectionString
                )
              : 'test');

          let collections: string[] = [];
          let schemaSamples: Record<string, unknown> = {};

          try {
            collections = await dataService.listCollections(dbName);
            // Get schema sample from first few collections (max 5)
            const collNames = collections
              .slice(0, 5)
              .map((c: any) => (typeof c === 'string' ? c : c.name));
            for (const collName of collNames) {
              try {
                const docs = await dataService.find(
                  `${dbName}.${collName}`,
                  {},
                  { limit: 1 }
                );
                if (docs.length > 0) {
                  schemaSamples[collName] = docs[0];
                }
              } catch {
                // Skip if we can't read a collection
              }
            }
          } catch (err) {
            logger.log.warn?.('COMPASS-AGENT', 'Failed to gather DB context', {
              error: (err as Error).message,
            });
          }

          const response = await queryAgent(action.message, config, {
            dbName,
            collections: collections.map((c: any) =>
              typeof c === 'string' ? c : c.name
            ),
            schemaSamples,
          });

          storeApi.dispatch(setLoading(false));
          storeApi.dispatch(
            addMessage('agent', response.explanation, {
              command: response.command,
              explanation: response.explanation,
              risk: response.risk,
            })
          );
        } catch (err: any) {
          storeApi.dispatch(setLoading(false));
          storeApi.dispatch(
            addMessage(
              'agent',
              `Error: ${err.message || String(err)}\n\nDetails: ${
                err.response
                  ? JSON.stringify(err.response, null, 2)
                  : err.stack || ''
              }\n\nPlease check your API key, base URL, and model name.`
            )
          );
        }
      }

      if (action.type === 'compass-agent-shell/ExecuteCommand') {
        try {
          // Execute the command using the data service's raw command
          // or the mongosh runtime
          const dbName =
            action.namespace?.split('.')[0] ||
            (connectionInfo.current.connectionOptions?.connectionString
              ? getDatabaseFromUri(
                  connectionInfo.current.connectionOptions.connectionString
                )
              : 'test');

          // Use dataService.command or raw evaluation
          // For now we use a simplified approach: parse the command and execute
          const result = await executeViaDataService(
            dataService,
            dbName,
            action.command
          );

          storeApi.dispatch(
            updatePendingResult(
              action.messageId,
              typeof result === 'string'
                ? result
                : JSON.stringify(result, null, 2)
            )
          );
        } catch (err) {
          storeApi.dispatch(
            updatePendingResult(
              action.messageId,
              `Execution error: ${(err as Error).message}`,
              true
            )
          );
        }
      }

      return result;
    };

  const store = createStore(reducer, applyMiddleware(thunk, agentMiddleware));

  return { store, deactivate: cleanup };
}

// ─── Helpers ─────────────────────────────────────────────────

function getDatabaseFromUri(uri: string): string {
  try {
    const url = new URL(uri);
    const path = url.pathname;
    // Remove leading slash
    const dbName = path.startsWith('/') ? path.slice(1) : path;
    // Remove query params if present
    return dbName.split('?')[0] || 'test';
  } catch {
    return 'test';
  }
}

/**
 * Execute a mongosh-style command via the Compass DataService.
 * This function parses simple mongosh commands and translates them
 * into DataService API calls.
 */
async function executeViaDataService(
  dataService: DataService,
  defaultDb: string,
  command: string
): Promise<unknown> {
  let targetDb = defaultDb;

  // Extract 'use <db>;' if present and strip it from the command
  const useMatch = command.match(/use\s+['"]?([a-zA-Z0-9_-]+)['"]?\s*;/i);
  if (useMatch) {
    targetDb = useMatch[1];
    command = command.replace(useMatch[0], '').trim();
  }

  // Parse: db.collectionName.find({...})
  // Or: db.collectionName.aggregate([...])
  // Or: db.collectionName.countDocuments({...})
  const findMatch = command.match(
    /db(?:\["([^"]+)"\]|\.(\w+))\.find\(([^]*)\)/
  );
  if (findMatch) {
    const collName = findMatch[1] || findMatch[2];
    const ns = `${targetDb}.${collName}`;
    let filter = {};
    try {
      // eslint-disable-next-line no-eval
      filter = new Function(`return (${findMatch[3] || '{}'})`)();
    } catch {
      filter = {};
    }
    const docs = await dataService.find(ns, filter, { limit: 20 });
    return docs;
  }

  const aggMatch = command.match(
    /db(?:\["([^"]+)"\]|\.(\w+))\.aggregate\(([^]*)\)/
  );
  if (aggMatch) {
    const collName = aggMatch[1] || aggMatch[2];
    const ns = `${targetDb}.${collName}`;
    let pipeline: unknown[] = [];
    try {
      // eslint-disable-next-line no-eval
      pipeline = new Function(`return (${aggMatch[3] || '[]'})`)();
    } catch {
      pipeline = [];
    }
    const docs = await dataService.aggregate(ns, pipeline);
    return docs;
  }

  const countMatch = command.match(
    /db(?:\["([^"]+)"\]|\.(\w+))\.countDocuments\(([^]*)\)/
  );
  if (countMatch) {
    const collName = countMatch[1] || countMatch[2];
    const ns = `${targetDb}.${collName}`;
    let filter = {};
    try {
      // eslint-disable-next-line no-eval
      filter = new Function(`return (${countMatch[3] || '{}'})`)();
    } catch {
      filter = {};
    }
    const count = await dataService.estimatedCount(ns);
    return { count };
  }

  const insertOneMatch = command.match(
    /db(?:\["([^"]+)"\]|\.(\w+))\.insertOne\(([^]*)\)/
  );
  if (insertOneMatch) {
    const collName = insertOneMatch[1] || insertOneMatch[2];
    const ns = `${targetDb}.${collName}`;
    let doc: Record<string, unknown> = {};
    try {
      // eslint-disable-next-line no-eval
      doc = new Function(`return (${insertOneMatch[3]})`)();
    } catch {
      throw new Error('Could not parse the document to insert.');
    }
    const result = await dataService.insertOne(ns, doc);
    return result;
  }

  const updateOneMatch = command.match(
    /db(?:\["([^"]+)"\]|\.(\w+))\.updateOne\(([^]*),\s*([^]*)\)/
  );
  if (updateOneMatch) {
    const collName = updateOneMatch[1] || updateOneMatch[2];
    const ns = `${targetDb}.${collName}`;
    let filter = {};
    let update = {};
    try {
      // eslint-disable-next-line no-eval
      filter = new Function(`return (${updateOneMatch[3]})`)();
      // eslint-disable-next-line no-eval
      update = new Function(`return (${updateOneMatch[4]})`)();
    } catch {
      throw new Error('Could not parse the update command.');
    }
    const result = await dataService.updateOne(ns, filter, update);
    return result;
  }

  const deleteOneMatch = command.match(
    /db(?:\["([^"]+)"\]|\.(\w+))\.deleteOne\(([^]*)\)/
  );
  if (deleteOneMatch) {
    const collName = deleteOneMatch[1] || deleteOneMatch[2];
    const ns = `${targetDb}.${collName}`;
    let filter = {};
    try {
      // eslint-disable-next-line no-eval
      filter = new Function(`return (${deleteOneMatch[3]})`)();
    } catch {
      throw new Error('Could not parse the delete filter.');
    }
    const result = await dataService.deleteOne(ns, filter);
    return result;
  }

  const getCollectionsMatch = command.match(/db\.getCollectionNames\(\)/);
  if (getCollectionsMatch) {
    const collections = await dataService.listCollections(targetDb);
    return collections.map((c: any) => (typeof c === 'string' ? c : c.name));
  }

  // Fallback: try to run as a raw command
  throw new Error(
    `Could not parse command. Supported operations: find, aggregate, countDocuments, insertOne, updateOne, deleteOne, getCollectionNames. Raw command:\n${command}`
  );
}
