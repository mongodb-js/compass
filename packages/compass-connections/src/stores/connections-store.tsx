import type { ConnectionInfo } from '@mongodb-js/connection-storage/provider';
import { useConnectionActions, useConnectionsState } from './store-context';

type State = {
  connectionErrors: Record<string, Error | null>;
  editingConnectionInfo: ConnectionInfo;
  isEditingConnectionInfoModalOpen: boolean;
  oidcDeviceAuthState: Record<string, { url: string; code: string }>;
};

/**
 * @deprecated use connections-store hooks instead
 */
export function useConnections(): {
  state: State;

  connect: (connectionInfo: ConnectionInfo) => Promise<void>;
  disconnect: (connectionId: string) => void;

  createNewConnection: () => void;
  editConnection: (connectionId: string) => void;
  saveEditedConnection: (connectionInfo: ConnectionInfo) => Promise<void>;
  cancelEditConnection: (connectionId: string) => void;
  duplicateConnection: (
    connectionId: string,
    options?: { autoDuplicate: boolean }
  ) => void;
  toggleConnectionFavoritedStatus: (connectionId: string) => void;
  removeConnection: (connectionId: string) => void;

  removeAllRecentConnections: () => void;
  showNonGenuineMongoDBWarningModal: (connectionId: string) => void;
} {
  const connectionsState = useConnectionsState();
  const state = {
    connectionErrors: Object.fromEntries(
      Object.entries(connectionsState.connections.byId).map(([k, v]) => {
        return [k, v.error ?? null];
      })
    ),
    editingConnectionInfo:
      connectionsState.connections.byId[
        connectionsState.editingConnectionInfoId
      ].info,
    isEditingConnectionInfoModalOpen:
      connectionsState.isEditingConnectionInfoModalOpen,
    oidcDeviceAuthState: Object.fromEntries(
      Object.entries(connectionsState.oidcDeviceAuthInfo).map(([k, v]) => {
        return [k, { url: v.verificationUrl, code: v.userCode }];
      })
    ),
  };
  const {
    connect,
    disconnect,
    createNewConnection,
    editConnection,
    saveEditedConnection,
    cancelEditConnection,
    duplicateConnection,
    toggleFavoritedConnectionStatus,
    removeConnection,
    removeAllRecentConnections,
    showNonGenuineMongoDBWarningModal,
  } = useConnectionActions();
  return {
    state,
    connect,
    disconnect,
    createNewConnection,
    editConnection,
    saveEditedConnection,
    cancelEditConnection,
    duplicateConnection,
    toggleConnectionFavoritedStatus: toggleFavoritedConnectionStatus,
    removeConnection,
    removeAllRecentConnections,
    showNonGenuineMongoDBWarningModal,
  };
}
