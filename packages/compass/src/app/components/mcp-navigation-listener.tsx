import { useEffect, useRef } from 'react';
import { ipcRenderer } from 'hadron-ipc';
import { useOpenWorkspace } from '@mongodb-js/compass-workspaces/provider';

/**
 * Listens for `mcp:open-collection` IPC events from the main process and
 * opens the requested collection in a workspace tab. Used by the
 * `compass-open-collection` MCP tool so external AI clients can navigate
 * the Compass UI without exposing data through the MCP response.
 *
 * Renders nothing — must be mounted inside the WorkspacesProvider scope so
 * that `useOpenWorkspace` resolves.
 */
export function McpNavigationListener(): null {
  const { openCollectionWorkspace } = useOpenWorkspace();
  // `useOpenWorkspace` returns a new object on every render, so
  // `openCollectionWorkspace` is a fresh reference each time. We park it on
  // a ref and subscribe to the IPC channel exactly once on mount; otherwise
  // a churning useEffect dep would attach + detach a listener per render.
  const openRef = useRef(openCollectionWorkspace);
  useEffect(() => {
    openRef.current = openCollectionWorkspace;
  }, [openCollectionWorkspace]);

  useEffect(() => {
    const handler = (
      _event: unknown,
      payload: { connectionId: string; namespace: string }
    ) => {
      // eslint-disable-next-line no-console
      console.log('[mcp] received open-collection IPC', payload);
      if (!payload?.connectionId || !payload?.namespace) return;
      try {
        openRef.current(payload.connectionId, payload.namespace, {
          newTab: true,
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[mcp] openCollectionWorkspace failed', err);
      }
    };
    ipcRenderer?.on('mcp:open-collection', handler as never);
    return () => {
      ipcRenderer?.removeListener('mcp:open-collection', handler as never);
    };
  }, []);

  return null;
}
