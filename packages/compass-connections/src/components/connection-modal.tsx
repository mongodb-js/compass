import { connect as reduxConnect } from 'react-redux';
import ConnectionFormModal from '@mongodb-js/connection-form';
import type { ConnectionInfo } from '@mongodb-js/connection-storage/provider';
import {
  connect,
  disconnect,
  cancelEditConnection,
  saveEditedConnectionInfo,
  saveAndConnect,
} from '../stores/connections-store-redux';

import type {
  ConnectionId,
  ConnectionState,
} from '../stores/connections-store-redux';

function shouldDisableConnectionEditing(connection: ConnectionState): boolean {
  return connection.status === 'connected';
}

function mapState({
  isEditingNewConnection,
  isEditingConnectionInfoModalOpen,
  editingConnectionInfo,
  connectionErrors,
  connections,
}: {
  isEditingNewConnection: boolean;
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
    editingConnectionInfo,
    isEditingNewConnection,
    connections,
  };
}

const mapDispatch = {
  connect,
  disconnect,
  cancelEditConnection,
  saveEditedConnectionInfo,
  saveAndConnect,
};

function mergeProps(
  stateProps: ReturnType<typeof mapState>,
  dispatchProps: {
    // TODO: surely there's a way of inferring these types?
    connect: (connectionInfo: ConnectionInfo) => any;
    disconnect: (id: string) => void;
    cancelEditConnection: (id: string) => void;
    saveEditedConnectionInfo: (connectionInfo: ConnectionInfo) => any;
    saveAndConnect: (connectionInfo: ConnectionInfo) => any;
  }
) {
  const {
    isOpen,
    initialConnectionInfo,
    connectionErrorMessage,
    disableEditingConnectedConnection,
    editingConnectionInfo,
    isEditingNewConnection,
  } = stateProps;

  const {
    connect,
    disconnect,
    saveAndConnect,
    saveEditedConnectionInfo,
    cancelEditConnection,
  } = dispatchProps;

  return {
    isOpen,
    initialConnectionInfo,
    connectionErrorMessage,
    disableEditingConnectedConnection,

    onDisconnectClicked: () => disconnect(editingConnectionInfo.id),
    setOpen: (newOpen: boolean) => {
      // This is how leafygreen propagates `X` button click
      if (newOpen === false) {
        cancelEditConnection(editingConnectionInfo.id);
      }
    },
    openSettingsModal: () => {
      // TODO: this has to emit on the global app registry somehow
    },
    onCancel: () => {
      cancelEditConnection(editingConnectionInfo.id);
    },
    onSaveClicked: (connectionInfo: ConnectionInfo) => {
      return saveEditedConnectionInfo(connectionInfo);
    },
    onConnectClicked:
      isEditingNewConnection || disableEditingConnectedConnection
        ? undefined
        : (connectionInfo: ConnectionInfo) => {
            void connect(connectionInfo);
          },
    onSaveAndConnectClicked: disableEditingConnectedConnection
      ? undefined
      : (connectionInfo: ConnectionInfo) => {
          void saveAndConnect(connectionInfo);
        },
  };
}

export default reduxConnect(
  mapState,
  mapDispatch,
  mergeProps
)(ConnectionFormModal);
