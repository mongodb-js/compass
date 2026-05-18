import { useEffect, useRef } from 'react';
import { ipcRenderer } from 'hadron-ipc';
import { useOpenWorkspace } from '@mongodb-js/compass-workspaces/provider';
import {
  useConnectionActions,
  useConnectionsListRef,
} from '@mongodb-js/compass-connections/provider';
import { MCP_IPC } from '@mongodb-js/compass-mcp-server';

/**
 * Listens for `mcp:open-collection` IPC events from the main process and
 * opens the requested collection in a workspace tab. Used by the
 * `compass-open-collection` MCP tool so external AI clients can navigate
 * the Compass UI without exposing data through the MCP response.
 *
 * If the target connection is not currently connected, we trigger the
 * normal Compass `connect()` action first — that runs the same auth /
 * elicitation flow the user gets when clicking a saved connection in the
 * sidebar — and only open the collection tab once the connection is up.
 *
 * Renders nothing — must be mounted inside the WorkspacesProvider and
 * compass-connections providers scope so the hooks resolve.
 */
export function McpNavigationListener(): null {
  const { openCollectionWorkspace } = useOpenWorkspace();
  const { connect } = useConnectionActions();
  const connectionsRef = useConnectionsListRef();
  // The three hook outputs are fresh references on each render; park them
  // on refs so the IPC subscription stays stable for the lifetime of the
  // component.
  const openRef = useRef(openCollectionWorkspace);
  const connectRef = useRef(connect);
  const connectionsListRef = useRef(connectionsRef);
  useEffect(() => {
    openRef.current = openCollectionWorkspace;
    connectRef.current = connect;
    connectionsListRef.current = connectionsRef;
  }, [openCollectionWorkspace, connect, connectionsRef]);

  useEffect(() => {
    type OpenOptions = {
      subtab?:
        | 'Documents'
        | 'Aggregations'
        | 'Schema'
        | 'Indexes'
        | 'Validation';
      initialQuery?: Record<string, unknown>;
      initialPipeline?: Record<string, unknown>[];
    };
    const handler = async (
      _event: unknown,
      payload: {
        connectionId: string;
        namespace: string;
        options?: OpenOptions;
      }
    ) => {
      // eslint-disable-next-line no-console
      console.log('[mcp] received open-collection IPC', payload);
      if (!payload?.connectionId || !payload?.namespace) return;
      try {
        const conn = connectionsListRef.current.getConnectionById(
          payload.connectionId
        );
        if (!conn) {
          // eslint-disable-next-line no-console
          console.warn(
            '[mcp] open-collection: unknown connection',
            payload.connectionId
          );
          return;
        }
        // If the connection isn't already active, run Compass's standard
        // connect flow first. This shows the auth/elicitation modals the
        // same way the sidebar does when a user clicks a saved
        // connection. We wait for the connect dispatch to resolve before
        // dispatching the workspace open, so the Collection tab has a
        // backing data service.
        if (conn.status !== 'connected') {
          await connectRef.current(conn.info);
        }
        // Use newTab:false so Compass de-dupes onto an existing tab for
        // the same namespace and respects canReplaceTab() — matches the
        // sidebar's "click a collection" behavior. Compass refuses to
        // replace tabs that hold unsaved work, so user state is safe.
        const o = payload.options ?? {};
        openRef.current(payload.connectionId, payload.namespace, {
          initialSubtab: o.subtab,
          initialQuery: o.initialQuery,
          initialPipeline: o.initialPipeline,
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[mcp] open-collection failed', err);
      }
    };
    ipcRenderer?.on(MCP_IPC.OpenCollection, handler);
    return () => {
      ipcRenderer?.removeListener(MCP_IPC.OpenCollection, handler);
    };
  }, []);

  return null;
}
