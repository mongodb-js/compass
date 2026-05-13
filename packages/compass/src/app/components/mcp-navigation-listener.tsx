import { useEffect, useRef } from 'react';
import { ipcRenderer } from 'hadron-ipc';
import { useOpenWorkspace } from '@mongodb-js/compass-workspaces/provider';
import {
  useConnectionActions,
  useConnectionsListRef,
} from '@mongodb-js/compass-connections/provider';

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
    const handler = async (
      _event: unknown,
      payload: { connectionId: string; namespace: string }
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
        openRef.current(payload.connectionId, payload.namespace, {
          newTab: true,
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[mcp] open-collection failed', err);
      }
    };
    ipcRenderer?.on('mcp:open-collection', handler as never);
    return () => {
      ipcRenderer?.removeListener('mcp:open-collection', handler as never);
    };
  }, []);

  return null;
}
