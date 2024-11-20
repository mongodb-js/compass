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
  openSettingsModal,
} from '../stores/connections-store-redux';

import { useConnectionFormPreferences } from '../hooks/use-connection-form-preferences';

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
  openSettingsModal,
};

type ConnectionModalProps = {
  isOpen: boolean;
  initialConnectionInfo?: ConnectionInfo;
  connectionErrorMessage?: string;
  disableEditingConnectedConnection: boolean;
  editingConnectionInfoId?: ConnectionId;
  isEditingNewConnection: boolean;
  connect: (connectionInfo: ConnectionInfo) => Promise<void>;
  disconnect: (id: string) => void;
  cancelEditConnection: (id: string) => void;
  saveEditedConnectionInfo: (connectionInfo: ConnectionInfo) => Promise<void>;
  saveAndConnect: (connectionInfo: ConnectionInfo) => Promise<void>;
  openSettingsModal: (tab?: string) => void;
};

const ConnectionModal: React.FunctionComponent<ConnectionModalProps> = ({
  // pulling initialConnectionInfo out of props to help TypeScript know that it
  // is not undefined by the time we render ConnectionFormModal
  initialConnectionInfo,
  // pulling editingConnectionInfoId and isEditingNewConnection out of props
  // because they aren't known to ConnectionFormModal and only get used here.
  editingConnectionInfoId,
  isEditingNewConnection,
  ...props
}) => {
  const formPreferences = useConnectionFormPreferences();

  const {
    disableEditingConnectedConnection,
    connect,
    disconnect,
    cancelEditConnection,
    saveEditedConnectionInfo,
    saveAndConnect,
  } = props;

  if (!(editingConnectionInfoId && initialConnectionInfo)) {
    return null;
  }

  return (
    <ConnectionFormModal
      initialConnectionInfo={initialConnectionInfo}
      {...props}
      {...formPreferences}
      onDisconnectClicked={() => disconnect(editingConnectionInfoId)}
      setOpen={(newOpen) => {
        // This is how leafygreen propagates `X` button click
        if (newOpen === false) {
          cancelEditConnection(editingConnectionInfoId);
        }
      }}
      onCancel={() => {
        cancelEditConnection(editingConnectionInfoId);
      }}
      onSaveClicked={(connectionInfo) => {
        return saveEditedConnectionInfo(connectionInfo);
      }}
      onConnectClicked={
        isEditingNewConnection || disableEditingConnectedConnection
          ? undefined
          : (connectionInfo) => {
              void connect(connectionInfo);
            }
      }
      onSaveAndConnectClicked={
        disableEditingConnectedConnection
          ? undefined
          : (connectionInfo) => {
              void saveAndConnect(connectionInfo);
            }
      }
    />
  );
};

export const ConnectedConnectionModal = reduxConnect(
  mapState,
  mapDispatch
)(ConnectionModal);

export default ConnectedConnectionModal;
