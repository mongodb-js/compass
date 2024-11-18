import React from 'react';
import { connect as reduxConnect } from '../stores/store-context';
import { ConnectionFormModal } from '@mongodb-js/connection-form';
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

type ConnectionModalProps = Omit<
  React.ComponentProps<typeof ConnectionFormModal>,
  'initialConnectionInfo'
> & { initialConnectionInfo?: ConnectionInfo };

const ConnectionModal: React.FunctionComponent<ConnectionModalProps> = ({
  initialConnectionInfo,
  ...props
}: ConnectionModalProps) => {
  if (!initialConnectionInfo) {
    return null;
  }
  return (
    <ConnectionFormModal
      initialConnectionInfo={initialConnectionInfo}
      {...props}
    />
  );
};

function shouldDisableConnectionEditing(connection: ConnectionState): boolean {
  return connection.status === 'connected';
}

function mapState({
  isEditingNewConnection,
  isEditingConnectionInfoModalOpen,
  editingConnectionInfoId,
  connections,
}: {
  isEditingNewConnection: boolean;
  isEditingConnectionInfoModalOpen: boolean;
  editingConnectionInfoId?: ConnectionId;
  connections: {
    byId: Record<ConnectionId, ConnectionState>;
  };
}) {
  const editingConnection = editingConnectionInfoId
    ? connections.byId[editingConnectionInfoId]
    : undefined;
  const editingConnectionInfo = editingConnection?.info;

  const disableEditingConnectedConnection = editingConnection
    ? shouldDisableConnectionEditing(editingConnection)
    : false;

  return {
    isOpen: isEditingConnectionInfoModalOpen,
    initialConnectionInfo: editingConnectionInfo,
    connectionErrorMessage: editingConnection?.error?.message,
    disableEditingConnectedConnection,
    editingConnectionInfoId,
    isEditingNewConnection,
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
): ConnectionModalProps {
  const {
    isOpen,
    initialConnectionInfo,
    connectionErrorMessage,
    disableEditingConnectedConnection,
    editingConnectionInfoId,
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

    onDisconnectClicked: () =>
      editingConnectionInfoId && disconnect(editingConnectionInfoId),
    setOpen: (newOpen: boolean) => {
      // This is how leafygreen propagates `X` button click
      if (newOpen === false) {
        editingConnectionInfoId &&
          cancelEditConnection(editingConnectionInfoId);
      }
    },
    openSettingsModal: () => {
      // TODO: this has to emit on the global app registry somehow
    },
    onCancel: () => {
      editingConnectionInfoId && cancelEditConnection(editingConnectionInfoId);
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

export default reduxConnect(mapState, mapDispatch, mergeProps)(ConnectionModal);
