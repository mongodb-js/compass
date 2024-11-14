import { connect } from 'react-redux';
import ConnectionFormModal from '@mongodb-js/connection-form';
import type { ConnectionInfo } from '@mongodb-js/connection-storage/provider';
import type {
  ConnectionId,
  ConnectionState,
} from '../stores/connections-store-redux';

function shouldDisableConnectionEditing(connection: ConnectionState): boolean {
  return connection.status === 'connected';
}

function mapState({
  isEditingConnectionInfoModalOpen,
  editingConnectionInfo,
  connectionErrors,
  connections,
}: {
  isEditingConnectionInfoModalOpen: boolean;
  editingConnectionInfo: ConnectionInfo;
  connectionErrors: Record<string, Error | null>;
  connections: {
    byId: Record<ConnectionId, ConnectionState>;
  };
}) {
  const disableEditingConnectedConnection = shouldDisableConnectionEditing(
    connections.byId[editingConnectionInfo.id]
  );

  return {
    isOpen: isEditingConnectionInfoModalOpen,
    initialConnectionInfo: editingConnectionInfo,
    connectionErrorMessage: connectionErrors[editingConnectionInfo.id]?.message,
    disableEditingConnectedConnection,
  };
}

function mapDispatch(
  {
    disconnect,
    cancelEditConnection,
  }: {
    //connect: (connectionInfo: ConnectionInfo) => Promise<void>;
    //saveAndConnect: (connectionInfo: ConnectionInfo) => Promise<void>;
    disconnect: (connectionId: string) => void;

    //createNewConnection: () => void;
    //editConnection: (connectionId: string) => void;
    //saveEditedConnection: (connectionInfo: ConnectionInfo) => Promise<void>;
    cancelEditConnection: (connectionId: string) => void;
    /*
  duplicateConnection: (
    connectionId: string,
    options?: { autoDuplicate: boolean }
  ) => void;
  */
    //toggleConnectionFavoritedStatus: (connectionId: string) => void;
    //removeConnection: (connectionId: string) => void;

    //removeAllRecentConnections: () => void;
    //showNonGenuineMongoDBWarningModal: (connectionId: string) => void;
  },
  {
    isEditingNewConnection,
    editingConnectionInfo,
    connections,
  }: {
    isEditingNewConnection: boolean;
    editingConnectionInfo: ConnectionInfo;
    connections: {
      byId: Record<ConnectionId, ConnectionState>;
    };
  }
) {
  const disableEditingConnectedConnection = shouldDisableConnectionEditing(
    connections.byId[editingConnectionInfo.id]
  );

  return {
    disconnect,
  };
}

export default connect(mapState, mapDispatch)(ConnectionFormModal);
