import { useEffect } from 'react';
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

  useEffect(() => {
    const handler = (
      _event: unknown,
      payload: { connectionId: string; namespace: string }
    ) => {
      // eslint-disable-next-line no-console
      console.log('[mcp] received open-collection IPC', payload);
      if (!payload?.connectionId || !payload?.namespace) return;
      openCollectionWorkspace(payload.connectionId, payload.namespace);
    };
    ipcRenderer?.on('mcp:open-collection', handler as never);
    return () => {
      ipcRenderer?.removeListener('mcp:open-collection', handler as never);
    };
  }, [openCollectionWorkspace]);

  return null;
}
